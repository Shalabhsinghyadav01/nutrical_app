import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Meal } from '../types/meal';
import { saveMeal, getMeals } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface MealsContextType {
  meals: Meal[];
  addMeal: (meal: Meal) => Promise<void>;
  updateMeal: (id: string, meal: Meal) => void;
  deleteMeal: (id: string) => void;
  getTodaysMeals: () => Meal[];
  isLoading: boolean;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

export function MealsProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load meals from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadMeals();
    }
  }, [user]);

  const loadMeals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const mealsData = await getMeals(user.id);
      setMeals(mealsData || []);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMeal = useCallback(async (meal: Meal) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Save to Supabase
      const savedMeal = await saveMeal({
        ...meal,
        user_id: user.id,
        created_at: new Date().toISOString()
      });
      
      // Update local state
      setMeals(prevMeals => [...prevMeals, savedMeal]);
    } catch (error) {
      console.error('Error saving meal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateMeal = useCallback((id: string, updatedMeal: Meal) => {
    setMeals(prevMeals => 
      prevMeals.map(meal => meal.id === id ? updatedMeal : meal)
    );
  }, []);

  const deleteMeal = useCallback((id: string) => {
    setMeals(prevMeals => prevMeals.filter(meal => meal.id !== id));
  }, []);

  const getTodaysMeals = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return meals.filter(meal => meal.dateTime.startsWith(today));
  }, [meals]);

  return (
    <MealsContext.Provider value={{ meals, addMeal, updateMeal, deleteMeal, getTodaysMeals, isLoading }}>
      {children}
    </MealsContext.Provider>
  );
}

export function useMeals() {
  const context = useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
} 