import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'event_invite_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WhatsApp Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is a WhatsApp status update event
    if (body.object === 'whatsapp_business_account') {
      await dbConnect();

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value && value.statuses) {
            for (const statusObj of value.statuses) {
              const messageId = statusObj.id;
              const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'

              if (messageId) {
                const updatePayload: Record<string, any> = {
                  whatsappStatus: status,
                };

                if (status === 'failed' && statusObj.errors?.length > 0) {
                  updatePayload.whatsappError = statusObj.errors[0].message || 'Meta Webhook delivery failed';
                }

                await Invite.findOneAndUpdate(
                  { whatsappMessageId: messageId },
                  { $set: updatePayload }
                );
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('WhatsApp Webhook error:', err);
    return NextResponse.json({ success: true }, { status: 200 }); // Always respond 200 to Meta
  }
}
