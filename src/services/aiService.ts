import { FoodItem, AIRecommendation, NutritionGoals, UserPreferences } from '../types/meal';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

class AIService {
  // Analyze food image and return nutritional information
  async analyzeFoodImage(imageUri: string): Promise<FoodItem> {
    // TODO: Implement real AI image analysis
    // This would integrate with a computer vision API
    return {
      id: Date.now().toString(),
      name: 'Detected Food',
      portion: 100,
      unit: 'g',
      calories: 250,
      protein: 12,
      carbs: 30,
      fat: 8,
      imageUrl: imageUri
    };
  }

  // Get personalized meal recommendations
  async getMealRecommendations(
    preferences: UserPreferences,
    goals: NutritionGoals
  ): Promise<AIRecommendation[]> {
    // TODO: Implement real AI recommendations
    return [
      {
        id: '1',
        type: 'meal',
        title: 'High-Protein Breakfast',
        description: 'Greek yogurt with berries and nuts',
        reasoning: 'Helps meet your protein goals while providing healthy fats',
        nutritionImpact: {
          calories: 300,
          protein: 20,
          carbs: 25,
          fat: 15
        }
      }
    ];
  }

  // Analyze eating patterns and provide insights
  async analyzeEatingPatterns(meals: FoodItem[]): Promise<string[]> {
    // TODO: Implement real pattern analysis
    return [
      'Your protein intake is consistently below target',
      'Consider adding more vegetables to your meals',
      'Your meal timing is well-distributed throughout the day'
    ];
  }

  // Generate meal plan based on goals and preferences
  async generateMealPlan(
    preferences: UserPreferences,
    goals: NutritionGoals
  ): Promise<any> {
    // TODO: Implement real meal planning
    return {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    };
  }

  // Chat with AI nutritionist
  async chatWithAI(message: string): Promise<string> {
    // TODO: Implement real AI chat
    return 'This would be a response from the AI nutritionist';
  }

  // Calculate optimal nutrition goals
  calculateNutritionGoals(
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female',
    activityLevel: string,
    goal: 'lose' | 'maintain' | 'gain'
  ): NutritionGoals {
    // Base Metabolic Rate calculation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const multiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2;
    let calories = bmr * multiplier;

    // Adjust for goal
    switch (goal) {
      case 'lose':
        calories *= 0.8; // 20% deficit
        break;
      case 'gain':
        calories *= 1.1; // 10% surplus
        break;
    }

    return {
      dailyCalories: Math.round(calories),
      protein: Math.round((calories * 0.3) / 4), // 30% of calories from protein
      carbs: Math.round((calories * 0.4) / 4),   // 40% of calories from carbs
      fat: Math.round((calories * 0.3) / 9),     // 30% of calories from fat
      water: Math.round(weight * 0.033)          // 33ml per kg of body weight
    };
  }
}

export const aiService = new AIService();

export async function analyzeMealFromText(
  mealName: string,
  cuisine: string,
  portionSize: string
): Promise<NutritionInfo> {
  try {
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
      }`;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a nutritionist AI that analyzes meals and provides accurate nutritional information. Respond only with the requested JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing meal:', error);
    throw error;
  }
}

export async function analyzeMealFromImage(imageBase64: string): Promise<{
  mealName: string;
  cuisine: string;
  nutrition: NutritionInfo;
}> {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are a nutritionist AI that analyzes food images and provides meal information and nutritional values."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What is this meal and what are its nutritional values?" },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 500,
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    // Parse the response to extract meal info
    // This is a simplified example - you might want to make the AI response more structured
    return {
      mealName: "Detected Meal Name", // Parse from AI response
      cuisine: "Detected Cuisine", // Parse from AI response
      nutrition: {
        calories: 300,
        protein: 15,
        carbs: 40,
        fat: 10
      }
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export async function analyzeMealFromDescription(description: string): Promise<{
  mealName: string;
  cuisine: string;
  portionSize: string;
  nutrition: NutritionInfo;
}> {
  try {
    const prompt = `Please analyze the following meal description and provide structured information:
      Description: ${description}
      
      Provide the information in the following JSON format:
      {
        "mealName": string,
        "cuisine": string,
        "portionSize": string (Small/Medium/Large/Extra Large),
        "nutrition": {
          "calories": number,
          "protein": number (in grams),
          "carbs": number (in grams),
          "fat": number (in grams)
        }
      }`;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a nutritionist AI that analyzes meal descriptions and provides structured meal information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing description:', error);
    throw error;
  }
} 