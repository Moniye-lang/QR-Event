import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import { v4 as uuidv4 } from 'uuid';
import { checkAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { name, email, maxUses } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const token = uuidv4();
    const newInvite = await Invite.create({
      name,
      email,
      token,
      maxUses: maxUses || 1,
    });

    return NextResponse.json({ success: true, invite: newInvite });
  } catch (err) {
    console.error('Create invite error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const invites = await Invite.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, invites });
  } catch (err) {
    console.error('List invites error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
