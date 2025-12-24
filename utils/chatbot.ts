import { ChatMessage } from '@/types/dashboard';

/**
 * Formats a timestamp to display time in HH:MM format
 */
export const formatChatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Checks if a message should be sent to the API
 * Prevents empty messages or very short inputs
 */
export const isValidMessage = (message: string): boolean => {
  return message.trim().length > 0;
};

/**
 * Generates a welcome message for the chatbot
 */
export const generateWelcomeMessage = (): ChatMessage => {
  return {
    id: 'welcome',
    content: 'Hello! I\'m your AI farming assistant. How can I help you today? You can ask me about farming techniques, crop management, pest control, or any agricultural questions you have.',
    role: 'assistant',
    timestamp: new Date()
  };
};

/**
 * Suggested topics for the chatbot
 */
export const suggestedTopics = [
  'What crops are best for sandy soil?',
  'How can I control aphids on my vegetables?',
  'Best practices for organic farming',
  'How to improve soil fertility naturally',
  'Water conservation techniques for small farms',
  'How to start a kitchen garden'
]; 