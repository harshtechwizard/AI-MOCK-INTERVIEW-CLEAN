const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  
  const safetySettings=[
    {
        category:HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category:HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category:HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category:HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold:HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }
  ];

  // Function to get model - tries different model names
  const getModel = (modelName = null) => {
    if (!apiKey) {
      throw new Error("Gemini API key is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // If specific model name provided, use it
    if (modelName) {
      return genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
        safetySettings,
      });
    }
    
    // Default to gemini-pro which is most widely available
    return genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig,
      safetySettings,
    });
  };

  // Export chatSession that uses generateContent directly
  export const chatSession = {
    _model: null,
    
    async sendMessage(message) {
      if (!this._model) {
        this._model = getModel();
      }
      
      try {
        // Use generateContent directly - more reliable than chat sessions
        const result = await this._model.generateContent(message);
        
        return {
          response: {
            text: () => result.response.text()
          }
        };
      } catch (error) {
        // If gemini-pro fails, try gemini-1.5-pro
        if (error.message?.includes("404") || error.message?.includes("not found")) {
          console.log("Trying gemini-1.5-pro as fallback...");
          this._model = getModel("gemini-1.5-pro");
          const result = await this._model.generateContent(message);
          
          return {
            response: {
              text: () => result.response.text()
            }
          };
        }
        throw error;
      }
    }
  };

