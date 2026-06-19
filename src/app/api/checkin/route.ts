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

    // Find the invite first to check if it exists
    const invite = await Invite.findOne({ token: token.trim() });

    if (!invite) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 404 });
    }

    if (invite.attending === 'no') {
      return NextResponse.json({ 
        success: false, 
        message: 'This guest declined the invitation.',
        name: invite.name
      }, { status: 400 });
    }

    if (invite.used) {
      return NextResponse.json({ 
        success: false, 
        message: `Already checked in at ${new Date(invite.usedAt).toLocaleString()}`,
        name: invite.name
      }, { status: 409 });
    }

    // Atomic update to prevent race conditions
    const updated = await Invite.findOneAndUpdate(
      { _id: invite._id, used: false },
      { used: true, usedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ 
        success: false, 
        message: 'This invite was just used by another scan.',
        name: invite.name
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Check-in successful!',
      name: updated.name 
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
