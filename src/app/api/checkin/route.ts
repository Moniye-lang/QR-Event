import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import { checkAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
    }

    // Clean token in case a full URL or query parameter was decoded by the camera
    let cleanToken = String(token || '').trim();
    if (cleanToken.includes('/invite/')) {
      cleanToken = cleanToken.split('/invite/')[1].split(/[?#/]/)[0].trim();
    } else if (cleanToken.includes('token=')) {
      const m = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
      if (m) cleanToken = m[1].trim();
    }

    // 1. FAST PATH: Single atomic query to check in unused tickets in 1 database roundtrip
    const updated = await Invite.findOneAndUpdate(
      { token: cleanToken, used: false, attending: { $ne: 'no' } },
      { $set: { used: true, usedAt: new Date() } },
      { new: true, select: 'name mainGuestName mainGuestId isAdditionalGuest tableNumber section used usedAt attending rsvpSubmitted' }
    ).lean();

    if (updated) {
      let hostName = updated.mainGuestName || '';
      if (updated.isAdditionalGuest && !hostName && updated.mainGuestId) {
        const host = await Invite.findById(updated.mainGuestId).select('name').lean();
        if (host) hostName = host.name;
      }

      const rawTable = (updated.tableNumber || '').trim();
      const formattedTable = rawTable
        ? (/^table\s+/i.test(rawTable) ? rawTable : `Table ${rawTable}`)
        : '';

      return NextResponse.json({
        success: true,
        message: 'Check-in successful!',
        name: updated.name,
        mainGuestName: hostName,
        tableNumber: formattedTable,
        rawTableNumber: rawTable,
        section: updated.section || 'section1',
        usedAt: updated.usedAt,
      });
    }

    // 2. DIAGNOSTIC FALLBACK: If not updated, diagnose why with a lightweight read
    const existing = await Invite.findOne({ token: cleanToken })
      .select('name mainGuestName mainGuestId isAdditionalGuest tableNumber section used usedAt attending rsvpSubmitted')
      .lean();

    if (!existing) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or unrecognized pass token.',
      }, { status: 404 });
    }

    let hostName = existing.mainGuestName || '';
    if (existing.isAdditionalGuest && !hostName && existing.mainGuestId) {
      const host = await Invite.findById(existing.mainGuestId).select('name').lean();
      if (host) hostName = host.name;
    }

    const rawTable = (existing.tableNumber || '').trim();
    const formattedTable = rawTable
      ? (/^table\s+/i.test(rawTable) ? rawTable : `Table ${rawTable}`)
      : '';

    if (existing.attending === 'no') {
      return NextResponse.json({
        success: false,
        message: 'This guest marked that they would not be attending.',
        name: existing.name,
        mainGuestName: hostName,
        tableNumber: formattedTable,
      }, { status: 400 });
    }

    if (existing.used) {
      const formattedTime = existing.usedAt
        ? new Date(existing.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'earlier';
      return NextResponse.json({
        success: false,
        message: `Already checked in at ${formattedTime}`,
        alreadyCheckedIn: true,
        name: existing.name,
        mainGuestName: hostName,
        tableNumber: formattedTable,
        usedAt: existing.usedAt,
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: 'Unable to check in guest.',
      name: existing.name,
      mainGuestName: hostName,
    }, { status: 400 });
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
