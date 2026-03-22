import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatbotConversation extends Document {
  userId: string;
  title?: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  category?: string;
  tags?: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatbotConversationSchema = new Schema<IChatbotConversation>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  title: {
    type: String,
    required: false
  },
  messages: [ChatMessageSchema],
  category: {
    type: String,
    required: false,
    enum: ['general', 'disease', 'crops', 'weather', 'soil', 'pesticides', 'fertilizers', 'irrigation', 'market', 'other']
  },
  tags: [{
    type: String
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.models.ChatbotConversation || mongoose.model<IChatbotConversation>('ChatbotConversation', ChatbotConversationSchema);
