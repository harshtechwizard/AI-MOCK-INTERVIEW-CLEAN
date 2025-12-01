/**
 * Ollama AI Integration for Local AI Processing
 * Uses Phi-3 Mini model running locally via Ollama
 */

const OLLAMA_API_URL = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'phi3:mini';

/**
 * Clean and extract JSON from AI response
 * @param {string} text - Raw AI response
 * @returns {string} - Cleaned response
 */
function cleanAIResponse(text) {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Try to extract JSON array first
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Remove control characters that break JSON parsing
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Fix common JSON issues
  cleaned = cleaned
    .replace(/\n/g, ' ')           // Remove newlines
    .replace(/\r/g, ' ')           // Remove carriage returns
    .replace(/\t/g, ' ')           // Remove tabs
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .replace(/,\s*}/g, '}')        // Remove trailing commas in objects
    .replace(/,\s*]/g, ']')        // Remove trailing commas in arrays
    .replace(/"\s*:\s*"/g, '":"')  // Fix spacing around colons
    .replace(/}\s*{/g, '},{');     // Fix missing commas between objects
  
  return cleaned.trim();
}

/**
 * Send a message to Ollama and get a response
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} - The AI response
 */
export async function sendMessageToOllama(prompt) {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return cleanAIResponse(data.response);
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    throw error;
  }
}

/**
 * Chat session object compatible with Gemini API structure
 */
export const ollamaChatSession = {
  async sendMessage(prompt) {
    const responseText = await sendMessageToOllama(prompt);
    
    // Return object structure compatible with Gemini API
    return {
      response: {
        text: () => responseText
      }
    };
  }
};
