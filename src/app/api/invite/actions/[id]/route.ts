import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import { checkAdmin } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const invite = await Invite.findByIdAndDelete(id);

    if (!invite) {
      return NextResponse.json({ success: false, message: 'Invite not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Invite deleted' });
  } catch (err) {
    console.error('Delete invite error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const invite = await Invite.findByIdAndUpdate(
      id,
      { used: false, usedAt: null },
      { new: true }
    );

    if (!invite) {
      return NextResponse.json({ success: false, message: 'Invite not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invite });
  } catch (err) {
    console.error('Reset invite error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
