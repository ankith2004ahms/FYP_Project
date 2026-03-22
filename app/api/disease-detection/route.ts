import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectMongoose } from '@/lib/mongoose';
import { DiseaseDetection } from '@/models';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    await connectMongoose();
    
    const skip = (page - 1) * limit;
    
    const detections = await DiseaseDetection.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DiseaseDetection.countDocuments({ userId });

    return NextResponse.json({
      detections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching disease detections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Disease Detection POST Debug ===');
    
    // Debug: Check if auth is working
    const authResult = await auth();
    console.log('Auth result:', authResult);
    
    const { userId } = authResult;
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('No userId found - returning 401');
      return NextResponse.json({ 
        error: 'Unauthorized - No user session found',
        debug: {
          hasAuth: !!authResult,
          authKeys: authResult ? Object.keys(authResult) : []
        }
      }, { status: 401 });
    }

    console.log('User authenticated, proceeding with save...');

    const body = await request.json();
    console.log('Request body:', body);
    
    const {
      imageUrl,
      imageName,
      predictedDisease,
      confidence,
      treatmentRecommendation,
      symptoms,
      preventiveMeasures,
      additionalNotes
    } = body;

    await connectMongoose();
    
    const diseaseDetection = new DiseaseDetection({
      userId,
      imageUrl,
      imageName,
      predictedDisease,
      confidence,
      treatmentRecommendation,
      symptoms,
      preventiveMeasures,
      additionalNotes,
      status: 'completed',
      createdAt: new Date()
    });

    await diseaseDetection.save();
    console.log('Disease detection saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Disease detection saved successfully',
      data: diseaseDetection
    });
  } catch (error) {
    console.error('Error in disease detection POST:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
