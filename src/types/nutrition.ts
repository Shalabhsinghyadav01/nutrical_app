export type Cuisine = 
  | 'Indian' 
  | 'Chinese' 
  | 'Italian' 
  | 'Mediterranean' 
  | 'Japanese' 
  | 'Mexican' 
  | 'American' 
  | 'Thai' 
  | 'Other';

export interface FoodItem {
  id: string;
  name: string;
  cuisine: Cuisine;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: number;
  unit: 'g' | 'ml' | 'piece';
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  dietaryRestrictions?: string[];
}

export interface NutritionGoals {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealEntry {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
} 