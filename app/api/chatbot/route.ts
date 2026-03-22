import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectMongoose } from '@/lib/mongoose';
import { ChatbotConversation } from '@/models';
import { generateTextWithFallback } from '@/utils/api-fallback';

const ollama_model = process.env.OLLAMA_MODEL;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const systemPrompt = "You are an AI assistant specialized in agriculture, farming, and related topics. You provide helpful, accurate, and practical advice to farmers. Your responses should be informative, respectful, and tailored to agricultural context. If you're unsure about something, be honest about limitations rather than making up information. and if the user asks you to respond in a specific language, respond in that language. and also if the user asks you questions outside of agriculture, farming, and related topics, politely decline and ask them to ask questions related to agriculture, farming, and related topics.";

    // Generate AI response with fallback system
    const responseText = await generateTextWithFallback(message, systemPrompt, 'english');
    
    if (!responseText) {
      return NextResponse.json(
        { error: "Failed to generate a response" },
        { status: 500 }
      );
    }

    // Save conversation to database
    await connectMongoose();
    
    let conversation;
    if (conversationId) {
      // Update existing conversation
      conversation = await ChatbotConversation.findOne({ userId, _id: conversationId });
      if (conversation) {
        conversation.messages.push({
          content: message,
          role: 'user',
          timestamp: new Date()
        });
        conversation.messages.push({
          content: responseText,
          role: 'assistant',
          timestamp: new Date()
        });
        conversation.updatedAt = new Date();
        await conversation.save();
      }
    } else {
      // Create new conversation
      conversation = new ChatbotConversation({
        userId,
        title: generateConversationTitle(message),
        messages: [
          {
            content: message,
            role: 'user',
            timestamp: new Date()
          },
          {
            content: responseText,
            role: 'assistant',
            timestamp: new Date()
          }
        ],
        status: 'active'
      });
      await conversation.save();
    }

    return NextResponse.json({ 
      response: responseText,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Error in chatbot API:', error);
    
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

function generateConversationTitle(message: string): string {
  // Generate a title from the first message
  const words = message.split(' ').slice(0, 5);
  return words.join(' ') + (message.split(' ').length > 5 ? '...' : '');
}
