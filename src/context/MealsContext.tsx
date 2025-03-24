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

// Utility functions for date handling
const getLocalDateString = (date: Date): string => {
  return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local timezone
};

const getStartOfLocalDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const isSameLocalDay = (date1: Date, date2: Date): boolean => {
  return getLocalDateString(date1) === getLocalDateString(date2);
};

export function MealsProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [lastLoadedDate, setLastLoadedDate] = useState<string>('');

  // Load meals from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadMeals();
    }
  }, [user]);

  // Check for date change and reload meals if needed
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const todayFormatted = now.toLocaleDateString('en-CA');
      
      // Force reload if date is different
      if (todayFormatted !== lastLoadedDate) {
        console.log('[DateChange] Detected date change:', {
          from: lastLoadedDate,
          to: todayFormatted,
          deviceTime: now.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        loadMeals();
        setLastLoadedDate(todayFormatted);
      }
    };

    // Check immediately
    checkDateChange();

    // Set up interval to check every minute
    const interval = setInterval(checkDateChange, 60000);

    return () => clearInterval(interval);
  }, [lastLoadedDate]);

  const loadMeals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const mealsData = await getMeals(user.id);
      const transformedMeals = (mealsData || []).map(meal => {
        // Keep the original date_time from the database
        return {
          id: meal.id,
          name: meal.name,
          dateTime: meal.date_time,
          type: meal.type,
          foods: JSON.parse(meal.foods || '[]'),
          totalCalories: meal.totalcalories || 0,
          totalProtein: meal.totalprotein || 0,
          totalCarbs: meal.totalcarbs || 0,
          totalFat: meal.totalfat || 0,
          notes: meal.notes,
          cuisine: meal.cuisine
        };
      });
      
      console.log('[MealsLoaded] Count:', transformedMeals.length);
      setMeals(transformedMeals);
      setLastLoadedDate(getLocalDateString(new Date()));
    } catch (error) {
      console.error('[LoadError]:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMeal = useCallback(async (meal: Meal) => {
    if (!user || !meal) return;
    setIsLoading(true);
    try {
      // Get current device date/time and adjust for timezone
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60000));
      const dateString = localDate.toISOString();
      
      console.log('[AddMeal] Adding meal at:', {
        deviceTime: now.toLocaleString(),
        deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: offset,
        adjustedDate: localDate.toLocaleString(),
        dateToSave: dateString
      });
      
      // Transform meal data for Supabase
      const mealForSave = {
        ...meal,
        user_id: user.id,
        created_at: dateString,
        date_time: dateString,
        foods: JSON.stringify(meal.foods || []),
        totalcalories: meal.totalCalories || 0,
        totalprotein: meal.totalProtein || 0,
        totalcarbs: meal.totalCarbs || 0,
        totalfat: meal.totalFat || 0
      };
      
      // Save to Supabase
      const savedMeal = await saveMeal(mealForSave);
      
      // Transform the saved meal back to frontend format
      const transformedMeal = {
        id: savedMeal.id,
        name: savedMeal.name,
        dateTime: dateString,
        type: savedMeal.type,
        foods: JSON.parse(savedMeal.foods || '[]'),
        totalCalories: savedMeal.totalcalories || 0,
        totalProtein: savedMeal.totalprotein || 0,
        totalCarbs: savedMeal.totalcarbs || 0,
        totalFat: savedMeal.totalfat || 0,
        notes: savedMeal.notes,
        cuisine: savedMeal.cuisine
      };
      
      // Update local state
      setMeals(prevMeals => [...prevMeals, transformedMeal]);
      
      // Force reload meals to ensure everything is in sync
      await loadMeals();
    } catch (error) {
      console.error('[AddMeal] Error:', error);
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
    const now = new Date();
    const todayString = getLocalDateString(now);
    
    console.log('[GetTodaysMeals] Current device date:', {
      deviceTime: now.toLocaleString(),
      todayString: todayString,
      deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset()
    });
    
    return meals.filter(meal => {
      if (!meal.dateTime) return false;
      
      // Adjust the meal date for timezone
      const mealDate = new Date(meal.dateTime);
      const offset = mealDate.getTimezoneOffset();
      const adjustedMealDate = new Date(mealDate.getTime() - (offset * 60000));
      const mealDateString = getLocalDateString(adjustedMealDate);
      
      const isToday = mealDateString === todayString;
      
      console.log('[GetTodaysMeals] Comparing meal:', {
        mealId: meal.id,
        originalDateTime: mealDate.toLocaleString(),
        adjustedDateTime: adjustedMealDate.toLocaleString(),
        mealDateString: mealDateString,
        isToday: isToday
      });
      
      return isToday;
    });
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