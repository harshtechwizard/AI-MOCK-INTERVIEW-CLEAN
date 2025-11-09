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

  // List of models to try in order of preference
  // gemini-1.5-flash is the most reliable and widely available
  // Users can override by setting NEXT_PUBLIC_GEMINI_MODEL env variable
  const MODEL_NAMES = process.env.NEXT_PUBLIC_GEMINI_MODEL
    ? [process.env.NEXT_PUBLIC_GEMINI_MODEL]
    : [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-2.0-flash-exp",
        "gemini-pro",
        "gemini-pro-vision",
      ];

  // Function to get model
  const getModel = (modelName) => {
    if (!apiKey) {
      throw new Error("Gemini API key is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig,
      safetySettings,
    });
  };

  // Function to get model with JSON response type
  const getModelWithJSON = (modelName) => {
    if (!apiKey) {
      throw new Error("Gemini API key is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        ...generationConfig,
        responseMimeType: "application/json",
      },
      safetySettings,
    });
  };

  // Export chatSession that uses generateContent directly
  export const chatSession = {
    _model: null,
    _modelIndex: 0,
    _jsonModel: null,
    _jsonModelIndex: 0,
    
    async sendMessage(message, options = {}) {
      const useJSON = options.json || false;
      
      // If JSON mode is requested, try JSON first, then fall back to text if needed
      if (useJSON) {
        try {
          return await this._tryModelsWithJSON(message);
        } catch (jsonError) {
          console.warn("JSON mode failed, falling back to text mode:", jsonError.message);
          // Fall back to text mode - the caller will parse JSON from text
          return await this._tryModelsWithText(message);
        }
      }
      
      // Regular text mode
      return await this._tryModelsWithText(message);
    },
    
    async _tryModelsWithJSON(message) {
      let lastError = null;
      const startIndex = this._jsonModelIndex || 0;
      
      for (let i = startIndex; i < MODEL_NAMES.length; i++) {
        const modelName = MODEL_NAMES[i];
        
        try {
          if (!this._jsonModel || this._jsonModelIndex !== i) {
            console.log(`Trying model: ${modelName} (JSON mode)...`);
            this._jsonModel = getModelWithJSON(modelName);
            this._jsonModelIndex = i;
          }
          
          const result = await this._jsonModel.generateContent(message);
          console.log(`✓ Successfully using model: ${modelName} (JSON mode)`);
          
          return {
            response: {
              text: () => result.response.text()
            }
          };
        } catch (error) {
          lastError = error;
          const errorMsg = error.message || error.toString() || "";
          const is404Error = errorMsg.includes("404") || 
                           errorMsg.includes("not found") || 
                           errorMsg.includes("is not found") ||
                           errorMsg.includes("not supported");
          
          if (is404Error || errorMsg.includes("application/json")) {
            // JSON mode not supported or model not available
            console.log(`✗ Model ${modelName} JSON mode not available: ${errorMsg.substring(0, 100)}`);
            this._jsonModel = null;
            continue;
          }
          
          console.error(`Error with model ${modelName} (JSON mode):`, errorMsg);
          throw error;
        }
      }
      
      throw new Error(
        `All models failed in JSON mode. Last error: ${lastError?.message || "Unknown error"}.`
      );
    },
    
    async _tryModelsWithText(message) {
      let lastError = null;
      const startIndex = this._modelIndex || 0;
      
      for (let i = startIndex; i < MODEL_NAMES.length; i++) {
        const modelName = MODEL_NAMES[i];
        
        try {
          if (!this._model || this._modelIndex !== i) {
            console.log(`Trying model: ${modelName} (text mode)...`);
            this._model = getModel(modelName);
            this._modelIndex = i;
          }
          
          const result = await this._model.generateContent(message);
          console.log(`✓ Successfully using model: ${modelName} (text mode)`);
          
          return {
            response: {
              text: () => result.response.text()
            }
          };
        } catch (error) {
          lastError = error;
          const errorMsg = error.message || error.toString() || "";
          const is404Error = errorMsg.includes("404") || 
                           errorMsg.includes("not found") || 
                           errorMsg.includes("is not found") ||
                           errorMsg.includes("not supported");
          
          if (is404Error) {
            console.log(`✗ Model ${modelName} not available: ${errorMsg.substring(0, 100)}`);
            this._model = null;
            continue;
          }
          
          console.error(`Error with model ${modelName}:`, errorMsg);
          throw error;
        }
      }
      
      throw new Error(
        `All Gemini models failed. Last error: ${lastError?.message || "Unknown error"}. ` +
        `Tried models: ${MODEL_NAMES.join(", ")}. ` +
        `Please check your API key and ensure at least one model is available in your project.`
      );
    }
  };

