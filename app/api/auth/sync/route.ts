import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectMongoose } from '@/lib/mongoose';
import { User } from '@/models';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, firstName, lastName, username, profileImageUrl } = body;

    await connectMongoose();
    
    let user = await User.findOne({ clerkId: userId });
    
    if (user) {
      user.email = email || user.email;
      user.firstName = firstName !== undefined ? firstName : user.firstName;
      user.lastName = lastName !== undefined ? lastName : user.lastName;
      user.username = username !== undefined ? username : user.username;
      user.profileImageUrl = profileImageUrl !== undefined ? profileImageUrl : user.profileImageUrl;
      
      await user.save();
    } else {
      user = new User({
        clerkId: userId,
        email,
        firstName,
        lastName,
        username,
        profileImageUrl
      });
      
      await user.save();
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
