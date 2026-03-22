import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectMongoose } from '@/lib/mongoose';
import { CropRecommendation } from '@/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoose();
    
    const recommendation = await CropRecommendation.findOne({ 
      _id: params.id, 
      userId 
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('Error fetching crop recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoose();
    
    const recommendation = await CropRecommendation.findOneAndDelete({ 
      _id: params.id, 
      userId 
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Error deleting crop recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
