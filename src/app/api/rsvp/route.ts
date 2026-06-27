import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import { v4 as uuidv4 } from 'uuid';
import { sendRsvpNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { token, name, email, phone, attending, guests, guestNames } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Invitation token is required.' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required.' }, { status: 400 });
    }

    if (!attending || (attending !== 'yes' && attending !== 'no')) {
      return NextResponse.json({ success: false, message: 'Attending status is required.' }, { status: 400 });
    }

    // Find existing invitation
    const existingInvite = await Invite.findOne({ token });
    if (!existingInvite) {
      return NextResponse.json({ success: false, message: 'Invalid invitation token.' }, { status: 400 });
    }

    if (existingInvite.rsvpSubmitted) {
      return NextResponse.json({ success: false, message: 'This RSVP link has already been used.' }, { status: 400 });
    }

    // Check duplicate name for the main guest
    const trimmedName = name.trim();
    const duplicateMain = await Invite.findOne({
      name: { $regex: new RegExp("^" + trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
      _id: { $ne: existingInvite._id }
    });

    if (duplicateMain) {
      return NextResponse.json({ success: false, message: `The name "${name}" is already registered.` }, { status: 400 });
    }

    if (attending === 'no') {
      // Update existing invite as declined
      existingInvite.name = trimmedName;
      existingInvite.email = email || '';
      existingInvite.phone = phone || '';
      existingInvite.attending = 'no';
      existingInvite.rsvpSubmitted = true;
      existingInvite.used = false;
      existingInvite.maxUses = 0;
      await existingInvite.save();

      // Send host notification
      await sendRsvpNotification({
        name: trimmedName,
        email: email || '',
        phone: phone || '',
        attending: 'no',
        guestsCount: 1,
        guestNames: [],
        tickets: [],
      });

      return NextResponse.json({ success: true, message: 'Declined RSVP recorded.', invite: existingInvite });
    }

    // Process attending: 'yes'
    const totalGuests = parseInt(guests) || 1;
    const additionalGuestNames: string[] = Array.isArray(guestNames) ? guestNames : [];
    const cleanedAdditionalNames = additionalGuestNames.map(n => n.trim()).filter(Boolean);

    // Validate additional guest names for duplicates within submission
    const lowercasedAdditionalNames = cleanedAdditionalNames.map(n => n.toLowerCase());
    const uniqueAdditionalNames = new Set(lowercasedAdditionalNames);
    if (uniqueAdditionalNames.size !== lowercasedAdditionalNames.length) {
      return NextResponse.json({ success: false, message: 'Duplicate names found in your additional guests list.' }, { status: 400 });
    }

    if (lowercasedAdditionalNames.includes(trimmedName.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'An additional guest name cannot be the same as the primary guest name.' }, { status: 400 });
    }

    // Validate additional guest names against database
    for (const guestName of cleanedAdditionalNames) {
      const duplicateGuest = await Invite.findOne({
        name: { $regex: new RegExp("^" + guestName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
      });
      if (duplicateGuest) {
        return NextResponse.json({ success: false, message: `The guest name "${guestName}" is already registered.` }, { status: 400 });
      }
    }

    // Update main guest invite
    existingInvite.name = trimmedName;
    existingInvite.email = email || '';
    existingInvite.phone = phone || '';
    existingInvite.attending = 'yes';
    existingInvite.guestNames = cleanedAdditionalNames;
    existingInvite.rsvpSubmitted = true;
    existingInvite.maxUses = 1;
    await existingInvite.save();

    const createdInvites = [existingInvite];

    // Create additional guest invites if applicable
    if (totalGuests > 1 && cleanedAdditionalNames.length > 0) {
      for (const guestName of cleanedAdditionalNames) {
        const guestToken = uuidv4();
        const guestInvite = await Invite.create({
          name: guestName,
          email: email || '', // associate with main guest's email
          phone: phone || '',
          token: guestToken,
          attending: 'yes',
          rsvpSubmitted: true,
          isAdditionalGuest: true,
          mainGuestId: existingInvite._id,
          maxUses: 1,
        });
        createdInvites.push(guestInvite);
      }
    }

    // Send host notification
    await sendRsvpNotification({
      name: trimmedName,
      email: email || '',
      phone: phone || '',
      attending: 'yes',
      guestsCount: totalGuests,
      guestNames: cleanedAdditionalNames,
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
