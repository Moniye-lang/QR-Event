import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import { checkAdmin } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { inviteId, isTemplate = false } = body;

    if (!inviteId) {
      return NextResponse.json({ success: false, message: 'inviteId is required' }, { status: 400 });
    }

    const invite = await Invite.findById(inviteId);
    if (!invite) {
      return NextResponse.json({ success: false, message: 'Invitation not found' }, { status: 404 });
    }

    if (!invite.phone || !invite.phone.trim()) {
      invite.whatsappStatus = 'failed';
      invite.whatsappError = 'Guest has no phone number recorded';
      invite.whatsappLastAttempt = new Date();
      await invite.save();

      return NextResponse.json({
        success: false,
        message: 'Guest has no phone number recorded',
        invite,
      }, { status: 400 });
    }

    // Determine host origin for absolute URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const path = invite.rsvpSubmitted ? `/invite/${invite.token}` : `/rsvp?token=${invite.token}`;
    const inviteUrl = `${origin}${path}`;

    // Mark as sending
    invite.whatsappStatus = 'sending';
    invite.whatsappLastAttempt = new Date();
    await invite.save();

    // Call Meta WhatsApp Cloud API
    const result = await sendWhatsAppMessage({
      recipientPhone: invite.phone,
      guestName: invite.name,
      inviteUrl,
      isTemplate,
    });

    if (result.success) {
      invite.whatsappStatus = 'sent';
      invite.whatsappMessageId = result.messageId || null;
      invite.whatsappSentAt = new Date();
      invite.whatsappError = null;
      await invite.save();

      return NextResponse.json({
        success: true,
        message: 'WhatsApp invitation sent successfully!',
        messageId: result.messageId,
        invite,
      });
    } else {
      invite.whatsappStatus = 'failed';
      invite.whatsappError = result.error || 'Failed to send WhatsApp message';
      await invite.save();

      return NextResponse.json({
        success: false,
        message: result.error || 'Failed to send WhatsApp message',
        invite,
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('WhatsApp single send error:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'Server error sending WhatsApp invitation',
    }, { status: 500 });
  }
}
