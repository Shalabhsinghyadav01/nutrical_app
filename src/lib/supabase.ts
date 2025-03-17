import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// User-related functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    console.log('Current user:', user);
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const signOut = async () => {
  try {
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    console.log('User signed out successfully');
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const isNewUser = async (userId: string) => {
  try {
    console.log('Checking if user is new:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('User is new (no profile found)');
        return true;
      }
      console.error('Error checking if user is new:', error);
      throw error;
    }
    
    console.log('User profile exists:', data);
    return false;
  } catch (error) {
    console.error('Error checking if user is new:', error);
    return true; // Assume new user in case of error
  }
};

// Meal-related functions
export const saveMeal = async (mealData: any) => {
  try {
    console.log('Saving meal data:', mealData);
    
    // Transform the data to match our database schema
    const transformedData = {
      ...mealData,
      date_time: mealData.dateTime, // Convert dateTime to date_time
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Remove the original dateTime field
    delete transformedData.dateTime;
    
    const { data, error } = await supabase
      .from('meals')
      .insert([transformedData]);
    
    if (error) {
      console.error('Error saving meal:', error);
      throw error;
    }
    console.log('Meal saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving meal:', error);
    throw error;
  }
};

export const getMeals = async (userId: string) => {
  try {
    console.log('Fetching meals for user:', userId);
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
    console.log('Meals fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching meals:', error);
    throw error;
  }
};

// Profile-related functions
export const saveProfile = async (profileData: {
  id: string;
  email?: string;
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  goal?: string;
  calorie_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fat_goal?: number;
  water_goal?: number;
}) => {
  try {
    console.log('Saving profile:', profileData);
    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData])
      .select()
      .single();

    if (error) {
      console.error('Error saving profile:', error);
      throw error;
    }

    console.log('Profile saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getProfile = async (userId: string) => {
  try {
    console.log('Fetching profile for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    console.log('Profile fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Notification-related functions
export const saveNotification = async (notificationData: any) => {
  try {
    console.log('Saving notification:', notificationData);
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData]);
    
    if (error) {
      console.error('Error saving notification:', error);
      throw error;
    }
    console.log('Notification saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

export const getNotifications = async (userId: string) => {
  try {
    console.log('Fetching notifications for user:', userId);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
    console.log('Notifications fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    console.log('Marking notification as read:', notificationId);
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
    console.log('Notification marked as read successfully:', data);
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Water intake related functions
export const saveWaterIntake = async (data: { user_id: string, date: string, glasses: number }) => {
  try {
    console.log('Saving water intake:', data);
    const { data: result, error } = await supabase
      .from('water_intake')
      .upsert([data], {
        onConflict: 'user_id,date'
      });
    
    if (error) {
      console.error('Error saving water intake:', error);
      throw error;
    }
    console.log('Water intake saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving water intake:', error);
    throw error;
  }
};

export const getWaterIntake = async (userId: string, date: string) => {
  try {
    console.log('Fetching water intake for user:', userId, 'date:', date);
    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (error) {
      console.error('Error fetching water intake:', error);
      throw error;
    }
    console.log('Water intake fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching water intake:', error);
    throw error;
  }
};

export const getWeeklyWaterIntake = async (userId: string, startDate: string, endDate: string) => {
  try {
    console.log('Fetching weekly water intake for user:', userId);
    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching weekly water intake:', error);
      throw error;
    }
    console.log('Weekly water intake fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching weekly water intake:', error);
    throw error;
  }
};

// Create default profile for new users
export const createDefaultProfile = async (userId: string, email: string) => {
  try {
    console.log('Creating default profile for user:', userId);
    const profileData = {
      id: userId,
      email: email,
      name: 'User',
      calorieGoal: 2400,
      proteinGoal: 150,
      carbsGoal: 300,
      fatGoal: 70,
      waterGoal: 8
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData]);
    
    if (error) {
      console.error('Error creating default profile:', error);
      throw error;
    }
    console.log('Default profile created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating default profile:', error);
    throw error;
  }
};

// Notification preference functions
export const saveNotificationPreference = async (preference: {
  id?: string;
  user_id: string;
  type: string;
  time: string;
  enabled: boolean;
  days: number[];
}) => {
  try {
    console.log('Saving notification preference:', preference);
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert([preference], {
        onConflict: 'user_id,type'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving notification preference:', error);
      throw error;
    }

    console.log('Notification preference saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving notification preference:', error);
    throw error;
  }
};

export const getNotificationPreferences = async (userId: string) => {
  try {
    console.log('Fetching notification preferences for user:', userId);
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }

    console.log('Notification preferences fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
}; 