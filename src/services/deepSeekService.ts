interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealAnalysis {
  mealName: string;
  cuisine: string;
  portionSize: string;
  nutrition: NutritionInfo;
}

interface MealExtraction {
  dishName: string;
  cuisine: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
  nutrition: NutritionInfo;
}

async function fetchDeepSeekAPI(prompt: string, isVision: boolean = false, imageBase64?: string): Promise<any> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DeepSeek API key is not set in environment variables');
      throw new Error('DeepSeek API key is missing');
    }

    let messages;
    if (isVision && imageBase64) {
      messages = [
        {
          role: "system",
          content: "You are a nutrition expert AI that provides accurate nutritional information and analysis. Always respond with raw JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt + "\n\nImage: " + imageBase64
        }
      ];
    } else {
      messages = [
        {
          role: "system",
          content: "You are a nutrition expert AI that provides accurate nutritional information and analysis. Always respond with raw JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ];
    }

    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    console.log('Attempting to call DeepSeek API:', apiUrl);
    console.log('Using API key:', apiKey.substring(0, 8) + '...');
    
    const requestBody = {
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    };

    // Log the request body for debugging (excluding the full image data)
    const debugRequestBody = {
      ...requestBody,
      messages: requestBody.messages.map(msg => ({
        ...msg,
        content: msg.content.includes('Image:') 
          ? msg.content.split('Image:')[0] + 'Image: [BASE64_IMAGE]'
          : msg.content
      }))
    };
    console.log('Request body:', JSON.stringify(debugRequestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`API call failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API response format:', data);
      throw new Error('Invalid API response format');
    }

    let content = data.choices[0].message.content;
    console.log('Raw message content:', content);
    
    // Remove markdown code block if present
    content = content.replace(/```json\n|\n```/g, '');
    
    // Try to parse as JSON
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing JSON content:', error);
      console.log('Failed to parse content:', content);
      throw error;
    }
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
}

export async function testDeepSeekConnection(): Promise<boolean> {
  try {
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    console.log('Testing DeepSeek API connection...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ],
        max_tokens: 5
      })
    });

    console.log('Test response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Test response error:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Test response data:', data);
    return true;
  } catch (error) {
    console.error('DeepSeek API Test Error:', error);
    return false;
  }
}

export async function analyzeMealWithDeepSeek(
  mealDescription: string,
  defaultCuisine: string = 'other',
  portionSize: string
): Promise<MealExtraction> {
  try {
    const prompt = `You are a nutrition expert. Analyze this meal description and extract information:
      
      Description: ${mealDescription}
      
      Respond with a JSON object in this exact format, with no additional text or formatting:
      {
        "dishName": "extracted name of the dish",
        "cuisine": "detected cuisine (if mentioned or can be inferred)",
        "mealType": "breakfast/lunch/dinner/snack (if mentioned in description, null if not mentioned)",
        "nutrition": {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      }
      
      Rules for extraction:
      1. Extract the main dish name, removing unnecessary words
      2. If cuisine is explicitly mentioned, use that; otherwise infer from ingredients/style
      3. If cuisine cannot be determined, use "other"
      4. Detect meal type if mentioned (breakfast/lunch/dinner/snack), return null if not mentioned
      5. Provide realistic nutrition estimates based on ${portionSize} portion size
      6. All nutrition numbers should be whole numbers`;

    const response = await fetchDeepSeekAPI(prompt);
    console.log('Meal analysis response:', response);
    
    // Validate the response
    if (typeof response !== 'object' || 
        !response.dishName ||
        !response.cuisine ||
        !response.nutrition ||
        !('calories' in response.nutrition) || 
        !('protein' in response.nutrition) || 
        !('carbs' in response.nutrition) || 
        !('fat' in response.nutrition)) {
      throw new Error('Invalid response format from API');
    }

    // Ensure all nutrition values are numbers
    const nutrition: NutritionInfo = {
      calories: Math.round(Number(response.nutrition.calories)) || 0,
      protein: Math.round(Number(response.nutrition.protein)) || 0,
      carbs: Math.round(Number(response.nutrition.carbs)) || 0,
      fat: Math.round(Number(response.nutrition.fat)) || 0
    };

    return {
      dishName: response.dishName,
      cuisine: response.cuisine.toLowerCase(),
      mealType: response.mealType,
      nutrition
    };
  } catch (error) {
    console.error('Error analyzing meal:', error);
    throw error;
  }
}

export async function analyzeMealImageWithDeepSeek(imageBase64: string): Promise<MealAnalysis> {
  try {
    const prompt = `I will provide you with a base64-encoded image of a meal. Please analyze it and provide nutritional information in the following JSON format:

    {
      "mealName": "detailed name of the dish",
      "cuisine": "specific cuisine type",
      "portionSize": "specific portion size (e.g., '1 cup', '250g', '1 serving')",
      "nutrition": {
        "calories": number (total calories),
        "protein": number (grams of protein),
        "carbs": number (grams of carbohydrates),
        "fat": number (grams of fat)
      }
    }

    Important:
    1. Be specific about the dish name and cuisine
    2. Estimate portion size based on the image
    3. Provide realistic nutritional values
    4. All numbers should be whole numbers
    5. Respond with ONLY the JSON object, no additional text`;

    const response = await fetchDeepSeekAPI(prompt, true, imageBase64);
    
    // Validate and clean the response
    if (typeof response !== 'object' || 
        !response.mealName ||
        !response.cuisine ||
        !response.portionSize ||
        !response.nutrition ||
        !('calories' in response.nutrition) ||
        !('protein' in response.nutrition) ||
        !('carbs' in response.nutrition) ||
        !('fat' in response.nutrition)) {
      throw new Error('Invalid response format from API');
    }

    // Ensure all nutrition values are numbers
    const nutrition: NutritionInfo = {
      calories: Math.round(Number(response.nutrition.calories)) || 0,
      protein: Math.round(Number(response.nutrition.protein)) || 0,
      carbs: Math.round(Number(response.nutrition.carbs)) || 0,
      fat: Math.round(Number(response.nutrition.fat)) || 0
    };

    return {
      mealName: response.mealName,
      cuisine: response.cuisine,
      portionSize: response.portionSize,
      nutrition
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export async function detectLanguageAndTransliterate(text: string): Promise<{
  original: string;
  transliterated: string | null;
  language: string;
}> {
  try {
    const prompt = `Analyze this text: "${text}"
    
    Respond with a JSON object in this exact format, with no additional text or formatting:
    {
      "original": "the input text",
      "transliterated": "transliterated version if not English, null if English",
      "language": "detected language name"
    }`;

    const response = await fetchDeepSeekAPI(prompt);
    console.log('Language detection response:', response);
    return response;
  } catch (error) {
    console.error('Error detecting language:', error);
    throw error;
  }
}

export async function translateText(text: string): Promise<string> {
  try {
    const prompt = `Translate this text to English and respond with a JSON object in this exact format, with no additional text or formatting:
    {
      "translation": "the English translation"
    }`;

    const response = await fetchDeepSeekAPI(prompt);
    return response.translation;
  } catch (error) {
    console.error('Error translating:', error);
    throw error;
  }
} 