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
    const body = await request.json().catch(() => ({}));

    let updateFields: any = {};
    if (!body || Object.keys(body).length === 0 || body.action === 'reset') {
      updateFields = { used: false, usedAt: null };
    } else {
      if (body.resetUsage) {
        updateFields.used = false;
        updateFields.usedAt = null;
      }
      if (typeof body.name === 'string') updateFields.name = body.name.trim();
      if (typeof body.phone === 'string') updateFields.phone = body.phone.trim();
      if (typeof body.mainGuestName === 'string') {
        const trimmed = body.mainGuestName.trim();
        updateFields.mainGuestName = trimmed;
        updateFields.isAdditionalGuest = Boolean(trimmed);
      }
      if (typeof body.maxUses === 'number') updateFields.maxUses = body.maxUses;
    }

    const invite = await Invite.findByIdAndUpdate(
      id,
      updateFields,
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
