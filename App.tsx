import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { MealsProvider } from './src/context/MealsContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { useAuth } from './src/context/AuthContext';
import { supabase, getCurrentUser, isNewUser } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';

// Auth screens
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';

// App screens
import DashboardScreen from './src/screens/DashboardScreen';
import AddMealScreen from './src/screens/AddMealScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AddMealTab"
        component={AddMealScreen}
        options={{
          title: 'Add Meal',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme, isDarkMode } = useTheme();
  const { user, loading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkIfNewUser(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        checkIfNewUser(session.user.id);
      }
    });
  }, []);

  const checkIfNewUser = async (userId: string) => {
    try {
      const newUser = await isNewUser(userId);
      setIsFirstTimeUser(newUser);
    } catch (error) {
      console.error('Error checking if user is new:', error);
      setIsFirstTimeUser(false);
    }
  };

  if (loading) {
    return null; // Or a loading screen
  }
  
  return (
    <PaperProvider theme={theme}>
      <UserProvider>
        <MealsProvider>
          <NotificationsProvider>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={theme.colors.surface}
            />
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerStyle: {
                    backgroundColor: theme.colors.surface,
                  },
                  headerTintColor: theme.colors.text,
                  headerShadowVisible: false,
                }}
              >
                {!session ? (
                  // Auth stack
                  <>
                    <Stack.Screen
                      name="SignIn"
                      component={SignInScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="SignUp"
                      component={SignUpScreen}
                      options={{ headerShown: false }}
                    />
                  </>
                ) : isFirstTimeUser ? (
                  // Profile setup screen for new users
                  <Stack.Screen
                    name="ProfileSetup"
                    component={ProfileSetupScreen}
                    options={{ 
                      headerShown: false,
                      gestureEnabled: false 
                    }}
                  />
                ) : (
                  // Main app stack
                  <>
                    <Stack.Screen
                      name="MainTabs"
                      component={TabNavigator}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen 
                      name="NotificationSettings" 
                      component={NotificationSettingsScreen}
                      options={{ title: 'Notification Settings' }}
                    />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </NotificationsProvider>
        </MealsProvider>
      </UserProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
