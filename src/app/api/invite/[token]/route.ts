import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();
    const { token } = await params;

    const invite = await Invite.findOne({ token });

    if (!invite) {
      return NextResponse.json({ success: false, message: 'Invite not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invite });
  } catch (err) {
    console.error('Get invite error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
