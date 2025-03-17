export interface Meal {
  id: string;
  name: string;
  dateTime: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
  cuisine?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  portion: number;
  unit: 'g' | 'ml' | 'piece' | 'serving';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}

export interface NutritionGoals {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteRecipes: string[];
  mealReminders: boolean;
  waterReminders: boolean;
}

export interface AIRecommendation {
  id: string;
  type: 'meal' | 'exercise' | 'habit';
  title: string;
  description: string;
  reasoning: string;
  nutritionImpact?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface ProgressData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight?: number;
  steps?: number;
  water?: number;
} 