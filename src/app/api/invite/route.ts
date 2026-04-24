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
    const body = await request.json();
    console.log('Create invite request body:', body);
    const { name, email, maxUses } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const token = uuidv4();
    try {
      const newInvite = await Invite.create({
        name,
        email: email || '',
        token,
        maxUses: maxUses || 1,
      });

      console.log('Invite created successfully:', newInvite._id);
      return NextResponse.json({ success: true, invite: newInvite });
    } catch (dbErr: any) {
      console.error('Database error creating invite:', dbErr);
      if (dbErr.code === 11000) {
        const field = Object.keys(dbErr.keyPattern)[0];
        return NextResponse.json({ 
          success: false, 
          message: `An invitation with this ${field} already exists.` 
        }, { status: 400 });
      }
      throw dbErr;
    }
  } catch (err: any) {
    console.error('Create invite error:', err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'Server error' 
    }, { status: 500 });
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
