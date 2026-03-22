import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectMongoose } from '@/lib/mongoose';
import { DiseaseDetection } from '@/models';

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
    
    const detection = await DiseaseDetection.findOne({ 
      _id: params.id, 
      userId 
    });

    if (!detection) {
      return NextResponse.json({ error: 'Detection not found' }, { status: 404 });
    }

    return NextResponse.json({ detection });
  } catch (error) {
    console.error('Error fetching disease detection:', error);
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
    
    const detection = await DiseaseDetection.findOneAndDelete({ 
      _id: params.id, 
      userId 
    });

    if (!detection) {
      return NextResponse.json({ error: 'Detection not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Detection deleted successfully' });
  } catch (error) {
    console.error('Error deleting disease detection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
