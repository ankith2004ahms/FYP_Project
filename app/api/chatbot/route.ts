import { NextResponse } from 'next/server';
import { generateText } from '@/utils/ollama';

const ollama_model = process.env.OLLAMA_MODEL;

export async function POST(request: Request) {
  try {
    // For local development, skip auth check
    // Get user message from request body
    const body = await request.json();
    const { message } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const systemPrompt = "You are an AI assistant specialized in agriculture, farming, and related topics. You provide helpful, accurate, and practical advice to farmers. Your responses should be informative, respectful, and tailored to the agricultural context. If you're unsure about something, be honest about limitations rather than making up information.";

    // Use the utility function to generate a response
    const responseText = await generateText(ollama_model, message, systemPrompt);
    
    if (!responseText) {
      return NextResponse.json(
        { error: "Failed to generate a response" },
        { status: 500 }
      );
    }

    // Return the response
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Error in chatbot API:', error);
    
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
} 