import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import { v4 as uuidv4 } from 'uuid';
import { sendRsvpNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, phone, attending, guests, guestNames } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required.' }, { status: 400 });
    }

    if (!attending || (attending !== 'yes' && attending !== 'no')) {
      return NextResponse.json({ success: false, message: 'Attending status is required.' }, { status: 400 });
    }

    const token = uuidv4();

    if (attending === 'no') {
      // Create a declined invite record to document their response in the system
      const newInvite = await Invite.create({
        name,
        email: email || '',
        phone: phone || '',
        token,
        attending: 'no',
        used: false,
        maxUses: 0, // Cannot check in
      });

      // Send host notification
      await sendRsvpNotification({
        name,
        email: email || '',
        phone: phone || '',
        attending: 'no',
        guestsCount: 1,
        guestNames: [],
        tickets: [],
      });

      return NextResponse.json({ success: true, message: 'Declined RSVP recorded.', invite: newInvite });
    }

    // Process attending: 'yes'
    const totalGuests = parseInt(guests) || 1;
    const additionalGuestNames: string[] = Array.isArray(guestNames) ? guestNames : [];

    // Create main guest invite
    const mainInvite = await Invite.create({
      name,
      email: email || '',
      phone: phone || '',
      token,
      attending: 'yes',
      guestNames: additionalGuestNames,
      isAdditionalGuest: false,
      maxUses: 1,
    });

    const createdInvites = [mainInvite];

    // Create additional guest invites if applicable
    if (totalGuests > 1 && additionalGuestNames.length > 0) {
      for (const guestName of additionalGuestNames) {
        if (!guestName.trim()) continue;
        const guestToken = uuidv4();
        const guestInvite = await Invite.create({
          name: guestName.trim(),
          email: email || '', // associate with main guest's email
          phone: phone || '',
          token: guestToken,
          attending: 'yes',
          isAdditionalGuest: true,
          mainGuestId: mainInvite._id,
          maxUses: 1,
        });
        createdInvites.push(guestInvite);
      }
    }

    // Send host notification
    await sendRsvpNotification({
      name,
      email: email || '',
      phone: phone || '',
      attending: 'yes',
      guestsCount: totalGuests,
      guestNames: additionalGuestNames,
      tickets: createdInvites.map((inv) => ({ name: inv.name, token: inv.token })),
    });

    return NextResponse.json({
      success: true,
      message: 'RSVP submitted successfully!',
      invites: createdInvites,
    });

  } catch (err: any) {
    console.error('RSVP API Error:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'An error occurred while processing your RSVP.'
    }, { status: 500 });
  }
}
