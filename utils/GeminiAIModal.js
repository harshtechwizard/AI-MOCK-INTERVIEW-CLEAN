const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
import rateLimiter from './RateLimiter';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Use Gemini 2.5 Flash - best for free tier
const MODEL_NAME = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  }
];

/**
 * Get Gemini model instance
 */
function getModel(responseType = "text") {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING: Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      ...generationConfig,
      responseMimeType: responseType === "json" ? "application/json" : "text/plain",
    },
    safetySettings,
  });
}

/**
 * Generate content with retry logic and rate limiting
 */
async function generateContentWithRetry(prompt, options = {}) {
  const { json = false, maxRetries = 3 } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use rate limiter to ensure we don't exceed free tier limits
      const result = await rateLimiter.executeWithRateLimit(async () => {
        const model = getModel(json ? "json" : "text");
        console.log(`🤖 Calling Gemini ${MODEL_NAME} (attempt ${attempt}/${maxRetries})...`);

        const response = await model.generateContent(prompt);
        return response;
      });

      const text = result.response.text();
      console.log(`✅ Gemini response received (${text.length} chars)`);

      return {
        response: {
          text: () => text
        }
      };

    } catch (error) {
      lastError = error;
      const errorMsg = error.message || error.toString();

      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, errorMsg.substring(0, 150));

      // Check error type
      const isRateLimit = errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED");

      const isNotFound = errorMsg.includes("404") ||
        errorMsg.includes("not found");

      const isInvalidKey = errorMsg.includes("API_KEY") ||
        errorMsg.includes("401") ||
        errorMsg.includes("403");

      // Don't retry on certain errors
      if (isNotFound) {
        throw new Error(
          `GEMINI_MODEL_NOT_FOUND: The model '${MODEL_NAME}' is not available. ` +
          `Please check your API key has access to Gemini models. ` +
          `Create a new key at: https://aistudio.google.com/app/apikey`
        );
      }

      if (isInvalidKey) {
        throw new Error(
          `GEMINI_API_KEY_INVALID: Your API key is invalid or doesn't have access. ` +
          `Get a new key at: https://aistudio.google.com/app/apikey`
        );
      }

      // For rate limits, wait longer before retry
      if (isRateLimit && attempt < maxRetries) {
        const waitTime = Math.min(30, Math.pow(2, attempt) * 2); // 4s, 8s, 16s
        console.log(`⏳ Rate limited. Waiting ${waitTime}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        continue;
      }

      // For other errors, exponential backoff
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1); // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${waitTime}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        continue;
      }

      // All retries exhausted
      if (isRateLimit) {
        throw new Error(
          `GEMINI_QUOTA_EXCEEDED: API quota exceeded. ` +
          `Free tier limit: 15 requests/minute. Please wait a moment and try again.`
        );
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Chat session object with sendMessage method
 */
export const chatSession = {
  async sendMessage(message, options = {}) {
    return await generateContentWithRetry(message, options);
  }
};

/**
 * Generate fallback mock questions when API fails
 */
export function generateFallbackQuestions(jobPosition, jobDescription, jobExperience, count = 5) {
  const questions = [
    {
      question: `Can you tell me about your experience as a ${jobPosition}?`,
      answer: `I have ${jobExperience} years of experience working as a ${jobPosition}. I've worked with ${jobDescription} and have developed strong skills in this area through various projects and challenges.`
    },
    {
      question: `What are your key strengths related to ${jobDescription}?`,
      answer: `My key strengths include deep knowledge of ${jobDescription}, problem-solving abilities, and the capacity to learn and adapt to new technologies quickly. I focus on writing clean, maintainable code and following best practices.`
    },
    {
      question: `Describe a challenging project you worked on as a ${jobPosition}.`,
      answer: `In one of my projects, I had to work with ${jobDescription} to build a complex system. The main challenge was optimizing performance while maintaining code quality. I overcame this by implementing efficient algorithms and conducting thorough testing.`
    },
    {
      question: `How do you stay updated with the latest trends in ${jobDescription}?`,
      answer: `I regularly follow official documentation, attend tech conferences and webinars, participate in online communities, read technical blogs, and work on personal projects to experiment with new features and best practices in ${jobDescription}.`
    },
    {
      question: `What would you say differentiates you from other ${jobPosition} candidates?`,
      answer: `With ${jobExperience} years of hands-on experience in ${jobDescription}, I bring both technical expertise and practical problem-solving skills. I'm passionate about continuous learning, mentoring others, and contributing to team success through collaboration and innovation.`
    },
    {
      question: `How do you approach debugging and troubleshooting in ${jobDescription}?`,
      answer: `I follow a systematic approach: first, I reproduce the issue, then analyze logs and error messages, use debugging tools, isolate the problem, and test potential solutions. I also document the issue and solution for future reference.`
    },
    {
      question: `Can you explain a complex technical concept from ${jobDescription} in simple terms?`,
      answer: `One important concept in ${jobDescription} is understanding the core principles and how different components interact. I would explain it by using real-world analogies and breaking down the concept into smaller, digestible parts that anyone can understand.`
    }
  ];

  return questions.slice(0, parseInt(count) || 5);
}

/**
 * Generate fallback feedback when API fails
 */
export function generateFallbackFeedback(question, userAnswer) {
  const answerLength = userAnswer?.length || 0;
  const hasContent = answerLength > 50;

  let rating = 5;
  let feedback = "This is a fallback response as the AI service is currently unavailable. ";

  if (!hasContent) {
    rating = 3;
    feedback += "Your answer seems brief. Try to provide more detailed explanations with specific examples. ";
  } else if (answerLength > 200) {
    rating = 7;
    feedback += "Good detailed response! ";
  } else {
    rating = 6;
    feedback += "Decent response. ";
  }

  feedback += "For a real AI evaluation, please ensure your API key is working correctly. Keep practicing!";

  return {
    rating: rating.toString(),
    feedback: feedback
  };
}
