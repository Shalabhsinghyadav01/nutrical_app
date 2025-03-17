import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  weight: number; // in kg
  height: number; // in cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  goalIntensity?: 'slow' | 'moderate' | 'aggressive'; // For weight loss/gain
  dietaryPreference?: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

interface UserContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  calculateNutritionGoals: (profile: Partial<UserProfile>) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isProfileComplete: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Load user profile from storage on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Save user profile to storage whenever it changes
  useEffect(() => {
    if (userProfile) {
      AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      setIsProfileComplete(true);
    } else {
      setIsProfileComplete(false);
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const calculateBMR = (profile: Partial<UserProfile>) => {
    if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
      return 0;
    }

    // Mifflin-St Jeor Equation
    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    if (profile.gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    return bmr;
  };

  const getActivityMultiplier = (activityLevel: string) => {
    const multipliers = {
      sedentary: 1.2,      // Little or no exercise
      light: 1.375,        // Light exercise 1-3 days/week
      moderate: 1.55,      // Moderate exercise 3-5 days/week
      active: 1.725,       // Heavy exercise 6-7 days/week
      very_active: 1.9     // Very heavy exercise, physical job
    };
    return multipliers[activityLevel as keyof typeof multipliers] || 1.2;
  };

  const calculateNutritionGoals = (profile: Partial<UserProfile>) => {
    const bmr = calculateBMR(profile);
    const tdee = bmr * getActivityMultiplier(profile.activityLevel || 'sedentary');
    
    let calorieGoal = tdee;
    
    // Adjust calories based on goal
    if (profile.goal === 'lose') {
      const deficit = profile.goalIntensity === 'aggressive' ? 0.25 : 
                     profile.goalIntensity === 'moderate' ? 0.2 : 0.15;
      calorieGoal = tdee * (1 - deficit);
    } else if (profile.goal === 'gain') {
      const surplus = profile.goalIntensity === 'aggressive' ? 0.2 : 
                     profile.goalIntensity === 'moderate' ? 0.15 : 0.1;
      calorieGoal = tdee * (1 + surplus);
    }

    // Calculate macros
    let proteinGoal: number;
    let fatGoal: number;
    let carbsGoal: number;

    if (profile.dietaryPreference === 'keto') {
      proteinGoal = profile.weight * 2.2; // g/kg
      fatGoal = (calorieGoal * 0.75) / 9; // 75% of calories from fat
      carbsGoal = 30; // Fixed 30g for keto
    } else {
      proteinGoal = profile.weight * (profile.goal === 'gain' ? 2.2 : 2); // g/kg
      fatGoal = (calorieGoal * 0.25) / 9; // 25% of calories from fat
      carbsGoal = (calorieGoal - (proteinGoal * 4 + fatGoal * 9)) / 4;
    }

    return {
      calories: Math.round(calorieGoal),
      protein: Math.round(proteinGoal),
      carbs: Math.round(carbsGoal),
      fat: Math.round(fatGoal)
    };
  };

  return (
    <UserContext.Provider value={{
      userProfile,
      setUserProfile,
      calculateNutritionGoals,
      isProfileComplete
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 