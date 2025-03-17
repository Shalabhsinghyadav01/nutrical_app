import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Gemini API with the correct configuration
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '', {
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1'
});

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Test function to verify API connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig,
      safetySettings,
    });

    const result = await model.generateContent("Test connection. Reply with 'OK'.");
    const response = await result.response;
    console.log('Gemini API Test Response:', response.text());
    return true;
  } catch (error) {
    console.error('Gemini API Test Error:', error);
    return false;
  }
}

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function analyzeMealWithGemini(
  mealName: string,
  cuisine: string,
  portionSize: string
): Promise<NutritionInfo> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig,
      safetySettings,
    });

    const prompt = `Please analyze the following meal and provide nutritional information:
      Meal: ${mealName}
      Cuisine: ${cuisine}
      Portion Size: ${portionSize}
      
      Provide the nutritional information in the following JSON format:
      {
        "calories": number,
        "protein": number (in grams),
        "carbs": number (in grams),
        "fat": number (in grams)
      }
      
      Only respond with the JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON response:', text);
      throw parseError;
    }
  } catch (error) {
    console.error('Error analyzing meal with Gemini:', error);
    throw error;
  }
}

export async function analyzeMealImageWithGemini(imageBase64: string): Promise<{
  mealName: string;
  cuisine: string;
  nutrition: NutritionInfo;
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro-vision",
      generationConfig,
      safetySettings,
    });
    
    const prompt = "What is this meal and what are its nutritional values? Respond in JSON format with mealName, cuisine, and nutrition (calories, protein, carbs, fat in grams). Only respond with the JSON.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      }
    ]);
    
    const response = await result.response;
    try {
      return JSON.parse(response.text());
    } catch (parseError) {
      console.error('Error parsing JSON response:', response.text());
      throw parseError;
    }
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw error;
  }
}

export async function translateText(text: string, targetLanguage: string = 'en'): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig,
      safetySettings,
    });
    
    const prompt = `Translate or transliterate the following text to English, maintaining the original meaning and phonetics if it's a name:
    
    Text: ${text}
    
    Only respond with the translated/transliterated text, no additional explanation.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error translating with Gemini:', error);
    throw error;
  }
}

export async function detectLanguageAndTransliterate(text: string): Promise<{
  original: string;
  transliterated: string | null;
  language: string;
}> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig,
      safetySettings,
    });
    
    const prompt = `Analyze the following text and respond in JSON format:
    1. Detect if it's in English or another language
    2. If not in English, provide the transliteration
    3. Identify the language
    
    Text: ${text}
    
    Respond only with JSON in this format:
    {
      "original": "original text",
      "transliterated": "transliterated text if not English, null if English",
      "language": "detected language name"
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
      return JSON.parse(response.text());
    } catch (parseError) {
      console.error('Error parsing JSON response:', response.text());
      throw parseError;
    }
  } catch (error) {
    console.error('Error detecting language with Gemini:', error);
    throw error;
  }
} 