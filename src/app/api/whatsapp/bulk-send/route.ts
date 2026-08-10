import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import { checkAdmin } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

interface BulkSendRequestBody {
  inviteIds?: string[];
  forceResend?: boolean;
  filter?: 'all_unsent' | 'failed_only' | 'all';
  isTemplate?: boolean;
  concurrency?: number;
  delayMs?: number;
  limit?: number;
}

// Utility for rate-limited delays between batches
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body: BulkSendRequestBody = await request.json();
    const {
      inviteIds,
      forceResend = false,
      filter = 'all_unsent',
      isTemplate = false,
      concurrency = 5,
      delayMs = 100,
      limit = 500,
    } = body;

    // Enforce safety bounds
    const maxLimit = Math.min(Math.max(Number(limit) || 500, 1), 500); // up to 500 max as required
    const workerConcurrency = Math.min(Math.max(Number(concurrency) || 5, 1), 10);
    const throttleDelay = Math.max(Number(delayMs) || 50, 0);

    // Build MongoDB query
    let query: Record<string, any> = {};

    if (Array.isArray(inviteIds) && inviteIds.length > 0) {
      query._id = { $in: inviteIds };
      if (!forceResend) {
        query.whatsappStatus = { $nin: ['sent', 'delivered'] };
      }
    } else {
      if (filter === 'failed_only') {
        query.whatsappStatus = 'failed';
      } else if (filter === 'all_unsent' || !forceResend) {
        query.whatsappStatus = { $nin: ['sent', 'delivered'] };
      }
    }

    // Fetch candidate invites up to maxLimit
    const candidates = await Invite.find(query).limit(maxLimit).sort({ createdAt: -1 });

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible invitations found for mass send.',
        totalProcessed: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        details: [],
      });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Separate valid candidates from candidates lacking phone numbers
    const validCandidates: typeof candidates = [];
    const skippedNoPhone: typeof candidates = [];

    for (const item of candidates) {
      if (item.phone && item.phone.trim()) {
        validCandidates.push(item);
      } else {
        skippedNoPhone.push(item);
      }
    }

    // Update missing phone candidates in DB as failed
    if (skippedNoPhone.length > 0) {
      const skippedIds = skippedNoPhone.map((i) => i._id);
      await Invite.updateMany(
        { _id: { $in: skippedIds } },
        {
          $set: {
            whatsappStatus: 'failed',
            whatsappError: 'No phone number recorded',
            whatsappLastAttempt: new Date(),
          },
        }
      );
    }

    // Lock valid candidate records to 'sending' status to prevent double sends
    const validIds = validCandidates.map((i) => i._id);
    await Invite.updateMany(
      { _id: { $in: validIds } },
      {
        $set: {
          whatsappStatus: 'sending',
          whatsappLastAttempt: new Date(),
        },
      }
    );

    // Process valid candidates in controlled concurrent batches
    let sentCount = 0;
    let failedCount = 0;
    const details: Array<{
      inviteId: string;
      name: string;
      phone: string;
      status: 'sent' | 'failed';
      messageId?: string;
      error?: string;
    }> = [];

    // Add log details for guests with no phone numbers
    for (const item of skippedNoPhone) {
      failedCount++;
      details.push({
        inviteId: item._id.toString(),
        name: item.name,
        phone: item.phone || '',
        status: 'failed',
        error: 'No phone number recorded',
      });
    }

    // Chunk worker execution
    for (let i = 0; i < validCandidates.length; i += workerConcurrency) {
      const chunk = validCandidates.slice(i, i + workerConcurrency);

      const chunkPromises = chunk.map(async (invite) => {
        const path = invite.rsvpSubmitted ? `/invite/${invite.token}` : `/rsvp?token=${invite.token}`;
        const inviteUrl = `${origin}${path}`;

        const result = await sendWhatsAppMessage({
          recipientPhone: invite.phone,
          guestName: invite.name,
          inviteUrl,
          isTemplate,
        });

        if (result.success) {
          await Invite.findByIdAndUpdate(invite._id, {
            $set: {
              whatsappStatus: 'sent',
              whatsappMessageId: result.messageId || null,
              whatsappSentAt: new Date(),
              whatsappError: null,
            },
          });

          return {
            inviteId: invite._id.toString(),
            name: invite.name,
            phone: invite.phone,
            status: 'sent' as const,
            messageId: result.messageId,
          };
        } else {
          await Invite.findByIdAndUpdate(invite._id, {
            $set: {
              whatsappStatus: 'failed',
              whatsappError: result.error || 'Failed to send WhatsApp message',
            },
          });

          return {
            inviteId: invite._id.toString(),
            name: invite.name,
            phone: invite.phone,
            status: 'failed' as const,
            error: result.error || 'Send failed',
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);

      for (const res of chunkResults) {
        if (res.status === 'sent') {
          sentCount++;
        } else {
          failedCount++;
        }
        details.push(res);
      }

      // Throttle delay between worker chunks to strictly control rate limiting
      if (i + workerConcurrency < validCandidates.length && throttleDelay > 0) {
        await sleep(throttleDelay);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Mass send complete. Processed ${candidates.length} invitations (${sentCount} sent, ${failedCount} failed).`,
      totalProcessed: candidates.length,
      sentCount,
      failedCount,
      skippedCount: skippedNoPhone.length,
      details,
    });
  } catch (err: any) {
    console.error('WhatsApp bulk send error:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'Server error processing WhatsApp mass send',
    }, { status: 500 });
  }
}
