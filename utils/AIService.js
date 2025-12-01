/**
 * Unified AI Service - Supports both Gemini and Ollama
 * Automatically switches based on configuration
 */

import { chatSession as geminiChatSession } from './GeminiAIModal';
import { ollamaChatSession } from './OllamaAIModal';

// Determine which AI service to use
const AI_PROVIDER = process.env.NEXT_PUBLIC_AI_PROVIDER || 'ollama'; // 'gemini' or 'ollama'

/**
 * Get the appropriate chat session based on configuration
 */
export const chatSession = AI_PROVIDER === 'gemini' ? geminiChatSession : ollamaChatSession;

/**
 * Check if AI service is available
 */
export async function checkAIAvailability() {
  try {
    if (AI_PROVIDER === 'ollama') {
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok;
    } else {
      // For Gemini, check if API key exists
      return !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }
  } catch (error) {
    console.error('AI service not available:', error);
    return false;
  }
}

export const AI_PROVIDER_NAME = AI_PROVIDER;
