import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectMongoose } from '@/lib/mongoose';
import { CropRecommendation } from '@/models';

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
    
    const recommendations = await CropRecommendation.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CropRecommendation.countDocuments({ userId });

    return NextResponse.json({
      recommendations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching crop recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      location,
      soilType,
      season,
      landSize,
      landUnit,
      recommendedCrops,
      weatherConditions,
      additionalAdvice
    } = body;

    if (!season || !recommendedCrops || !Array.isArray(recommendedCrops)) {
      return NextResponse.json({ 
        error: 'Required fields: season, recommendedCrops (array)' 
      }, { status: 400 });
    }

    await connectMongoose();
    
    const recommendation = new CropRecommendation({
      userId,
      location,
      soilType,
      season,
      landSize,
      landUnit,
      recommendedCrops,
      weatherConditions,
      additionalAdvice
    });

    await recommendation.save();

    return NextResponse.json({ recommendation }, { status: 201 });
  } catch (error) {
    console.error('Error creating crop recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
