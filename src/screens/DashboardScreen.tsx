import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Text, Surface, IconButton, ProgressBar, Button } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaterIntake from '../components/WaterIntake';
import TodaysMeals from '../components/TodaysMeals';
import { useMeals } from '../context/MealsContext';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getCurrentUser, saveNotification } from '../lib/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type DayData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const motivationalQuotes = [
  "Every meal is a chance to nourish your future self.",
  "Small changes, big results. Keep going!",
  "Your body is a reflection of your lifestyle.",
  "The only bad workout is the one that didn't happen.",
  "You don't have to be extreme, just consistent.",
  "Progress is progress, no matter how small.",
  "Your health is an investment, not an expense.",
  "The future you is watching you right now.",
  "Make yourself proud.",
  "Trust the process, embrace the journey."
];

// Utility functions for date handling
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameLocalDay = (date1: Date, date2: Date): boolean => {
  return getLocalDateString(date1) === getLocalDateString(date2);
};

export default function DashboardScreen() {
  const [mealsModalVisible, setMealsModalVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const { getTodaysMeals, meals } = useMeals();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile } = useUser();
  const { theme } = useTheme();
  
  // Force a re-render when the date changes
  const [currentDate, setCurrentDate] = useState(new Date());
  
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const currentDateString = now.toLocaleDateString('en-US').split('/');
      const formattedCurrentDate = `${currentDateString[2]}-${String(currentDateString[0]).padStart(2, '0')}-${String(currentDateString[1]).padStart(2, '0')}`;
      const lastDateString = currentDate.toLocaleDateString('en-US').split('/');
      const formattedLastDate = `${lastDateString[2]}-${String(lastDateString[0]).padStart(2, '0')}-${String(lastDateString[1]).padStart(2, '0')}`;
      
      if (formattedCurrentDate !== formattedLastDate) {
        console.log('Date changed in DashboardScreen from', formattedLastDate, 'to', formattedCurrentDate);
        setCurrentDate(now);
      }
    };

    // Check immediately
    updateDate();

    // Set up interval to check every minute
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, [currentDate]);
  
  const todaysMeals = getTodaysMeals();
  
  useEffect(() => {
    // Get a random quote when the component mounts or screen is focused
    const getRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setCurrentQuote(motivationalQuotes[randomIndex]);
    };

    getRandomQuote();

    // Add listener for when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      getRandomQuote();
    });

    return unsubscribe;
  }, [navigation]);
  
  useEffect(() => {
    const testNotification = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          await saveNotification({
            user_id: user.id,
            title: 'Welcome to NutriCal',
            message: 'Thank you for using our app! This is a test notification.',
            type: 'welcome'
          });
          console.log('Test notification created successfully');
        }
      } catch (error) {
        console.error('Error creating test notification:', error);
      }
    };

    testNotification();
  }, []);
  
  // Calculate totals from actual meals
  const totalCalories = todaysMeals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
  const totalProtein = todaysMeals.reduce((sum, meal) => sum + (meal.totalProtein || 0), 0);
  const totalCarbs = todaysMeals.reduce((sum, meal) => sum + (meal.totalCarbs || 0), 0);
  const totalFat = todaysMeals.reduce((sum, meal) => sum + (meal.totalFat || 0), 0);

  // Use goals from userProfile
  const calorieGoal = userProfile?.calorieGoal || 2400;
  const proteinGoal = userProfile?.proteinGoal || 150;
  const carbsGoal = userProfile?.carbsGoal || 300;
  const fatGoal = userProfile?.fatGoal || 70;

  const getMacroColor = (current: number, goal: number) => {
    const ratio = current / goal;
    if (ratio < 0.5) return theme.colors.error;
    if (ratio < 0.8) return theme.colors.secondary;
    return theme.colors.primary;
  };

  // Format meals for TodaysMeals component
  const formattedMeals = todaysMeals.map(meal => ({
    name: meal.name,
    time: meal.dateTime ? new Date(meal.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time',
    cuisine: meal.type.charAt(0).toUpperCase() + meal.type.slice(1),
    calories: meal.totalCalories || 0,
    protein: meal.totalProtein || 0,
    carbs: meal.totalCarbs || 0,
    fat: meal.totalFat || 0
  }));

  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide the default header
    });
  }, [navigation]);

  // Get meals for a specific week based on offset
  const getWeeklyData = () => {
    const now = new Date();
    
    // Get the start of the current week (Monday)
    const currentWeekStart = getStartOfWeek(now);
    
    // Apply week offset
    const targetWeekStart = addDays(currentWeekStart, -7 * weekOffset);
    
    console.log('[WeeklyData] Week starting from:', targetWeekStart.toLocaleString());

    // Generate array of dates for the week
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(targetWeekStart, i);
      return getLocalDateString(date);
    });

    console.log('[WeeklyData] Days in week:', weekDays);

    return weekDays.map(dateString => {
      // Filter meals for this specific day
      const dayMeals = meals.filter(meal => {
        if (!meal.dateTime) return false;
        const mealDate = new Date(meal.dateTime);
        return getLocalDateString(mealDate) === dateString;
      });

      // Calculate daily totals
      const dayCalories = dayMeals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
      const dayProtein = dayMeals.reduce((sum, meal) => sum + (meal.totalProtein || 0), 0);
      const dayCarbs = dayMeals.reduce((sum, meal) => sum + (meal.totalCarbs || 0), 0);
      const dayFat = dayMeals.reduce((sum, meal) => sum + (meal.totalFat || 0), 0);

      return {
        date: dateString,
        calories: dayCalories,
        protein: dayProtein,
        carbs: dayCarbs,
        fat: dayFat,
      };
    });
  };

  const weeklyData = getWeeklyData();
  const maxCalories = Math.max(...weeklyData.map(day => day.calories));

  const getWeekRangeText = () => {
    const startDate = new Date(weeklyData[0].date);
    const endDate = new Date(weeklyData[6].date);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const DayDetailsModal = ({ day, visible, onDismiss }: { day: DayData; visible: boolean; onDismiss: () => void }) => {
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const MacroCard = ({ label, value, goal }: { label: string; value: number; goal: number }) => (
      <Surface 
        style={[
          styles.macroCard, 
          { backgroundColor: theme.colors.surfaceVariant }
        ]} 
        elevation={0}
      >
        <Text style={[styles.macroCardLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.macroCardValue, { color: theme.colors.text }]}>{value}{label !== 'Calories' ? 'g' : ''}</Text>
        <Text style={[styles.macroCardGoal, { color: theme.colors.textSecondary }]}>
          {Math.round((value / goal) * 100)}% of goal
        </Text>
      </Surface>
    );

    return (
      <Modal
        visible={visible}
        onRequestClose={onDismiss}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <Surface 
            style={[
              styles.modalContent, 
              { backgroundColor: theme.colors.surface }
            ]} 
            elevation={5}
          >
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.text }]}>
                {formattedDate}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
                iconColor={theme.colors.text}
              />
            </View>

            <View style={styles.macroCardsContainer}>
              <MacroCard label="Calories" value={day.calories} goal={calorieGoal} />
              <MacroCard label="Protein" value={day.protein} goal={proteinGoal} />
              <MacroCard label="Carbs" value={day.carbs} goal={carbsGoal} />
              <MacroCard label="Fat" value={day.fat} goal={fatGoal} />
            </View>

            <Button
              mode="contained"
              onPress={onDismiss}
              style={styles.modalButton}
              contentStyle={styles.modalButtonContent}
            >
              Close
            </Button>
          </Surface>
        </View>
      </Modal>
    );
  };

  const renderHistorySection = () => {
    if (!userProfile) {
      return (
        <Surface style={[styles.historyContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Loading profile...</Text>
        </Surface>
      );
    }

    if (!meals || meals.length === 0) {
      return (
        <Surface style={[styles.historyContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.historyHeader}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Progress</Text>
          </View>
          <View style={[styles.emptyState, { paddingVertical: 40 }]}>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              No meals recorded yet. Add your first meal to see your progress!
            </Text>
          </View>
        </Surface>
      );
    }

    return (
      <Surface style={[styles.historyContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.historyHeader}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Progress</Text>
          <View style={styles.weekNavigation}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={() => setWeekOffset(prev => prev + 1)}
              iconColor={theme.colors.primary}
            />
            <Text style={[styles.weekRangeText, { color: theme.colors.text }]}>{getWeekRangeText()}</Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={() => setWeekOffset(prev => Math.max(prev - 1, 0))}
              iconColor={theme.colors.primary}
              disabled={weekOffset === 0}
            />
          </View>
        </View>
        
        <View style={styles.historyBars}>
          {weeklyData.map((day, index) => {
            const height = (day.calories / (calorieGoal || 2000)) * 150;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const isToday = isSameLocalDay(date, new Date());

            return (
              <TouchableOpacity 
                key={day.date} 
                style={styles.historyBarContainer}
                onPress={() => setSelectedDay(day)}
              >
                <View style={styles.historyBarWrapper}>
                  <View 
                    style={[
                      styles.historyBar, 
                      { 
                        height: Math.max(height, 20),
                        backgroundColor: isToday ? theme.colors.primary : theme.colors.surfaceVariant,
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.historyBarLabel, 
                  { 
                    color: isToday ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isToday ? '600' : '500'
                  }
                ]}>{dayName}</Text>
                <Text style={[
                  styles.historyBarValue, 
                  { 
                    color: isToday ? theme.colors.primary : theme.colors.text,
                    fontWeight: isToday ? '700' : '600'
                  }
                ]}>
                  {day.calories}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.historyStats}>
          <View style={styles.historyStatItem}>
            <Text style={[styles.historyStatLabel, { color: theme.colors.textSecondary }]}>Avg. Calories</Text>
            <Text style={[styles.historyStatValue, { color: theme.colors.text }]}>
              {Math.round(weeklyData.reduce((sum, day) => sum + day.calories, 0) / 7)}
            </Text>
          </View>
          <View style={styles.historyStatItem}>
            <Text style={[styles.historyStatLabel, { color: theme.colors.textSecondary }]}>Avg. Protein</Text>
            <Text style={[styles.historyStatValue, { color: theme.colors.text }]}>
              {Math.round(weeklyData.reduce((sum, day) => sum + day.protein, 0) / 7)}g
            </Text>
          </View>
          <View style={styles.historyStatItem}>
            <Text style={[styles.historyStatLabel, { color: theme.colors.textSecondary }]}>Best Day</Text>
            <Text style={[styles.historyStatValue, { color: theme.colors.success }]}>
              {Math.max(...weeklyData.map(day => day.calories))}
            </Text>
          </View>
        </View>

        {selectedDay && (
          <DayDetailsModal
            day={selectedDay}
            visible={!!selectedDay}
            onDismiss={() => setSelectedDay(null)}
          />
        )}
      </Surface>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <View style={styles.headerTop}>
            <Text variant="headlineLarge" style={[styles.appTitle, { color: theme.colors.primary }]}>NutriCal</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Notifications')}
                style={styles.headerIcon}
              >
                <Ionicons 
                  name="notifications-outline" 
                  size={24} 
                  color={theme.colors.text} 
                  style={{ opacity: 0.8 }}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Settings')}
                style={styles.headerIcon}
              >
                <Ionicons 
                  name="settings-outline" 
                  size={24} 
                  color={theme.colors.text}
                  style={{ opacity: 0.8 }}
                />
              </TouchableOpacity>
            </View>
          </View>
          <Text variant="titleMedium" style={[styles.greeting, { color: theme.colors.text }]}>
            Hello, {userProfile?.name || 'User'}! 👋
          </Text>
          <Surface style={[styles.quoteContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.quote, { color: theme.colors.textSecondary }]}>{currentQuote}</Text>
          </Surface>
        </View>

        <Pressable onPress={() => setMealsModalVisible(true)}>
          <Surface style={[styles.dailyOverview, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="headlineLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Overview</Text>
            
            {/* Calories Section */}
            <View style={styles.caloriesSection}>
              <View style={styles.calorieHeader}>
                <Text style={[styles.calorieTitle, { color: theme.colors.text }]}>Calories</Text>
                <Text style={[styles.caloriePercentage, { color: theme.colors.primary }]}>
                  {Math.round((totalCalories / calorieGoal) * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={totalCalories / calorieGoal}
                color={theme.colors.primary}
                style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
              />
              <View style={styles.calorieValues}>
                <Text style={[styles.consumedText, { color: theme.colors.textSecondary }]}>
                  {totalCalories} consumed
                </Text>
                <Text style={[styles.remainingText, { color: theme.colors.textSecondary }]}>
                  {calorieGoal - totalCalories} remaining
                </Text>
              </View>
            </View>

            {/* Macros Section */}
            <View style={styles.macrosContainer}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Protein</Text>
                <View style={[styles.macroBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={[styles.macroProgress, { 
                    backgroundColor: getMacroColor(totalProtein, proteinGoal),
                    width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%`
                  }]} />
                </View>
                <Text style={[styles.macroValue, { color: theme.colors.text }]}>{totalProtein}g</Text>
              </View>

              <View style={styles.macroItem}>
                <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Carbs</Text>
                <View style={[styles.macroBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={[styles.macroProgress, { 
                    backgroundColor: getMacroColor(totalCarbs, carbsGoal),
                    width: `${Math.min((totalCarbs / carbsGoal) * 100, 100)}%`
                  }]} />
                </View>
                <Text style={[styles.macroValue, { color: theme.colors.text }]}>{totalCarbs}g</Text>
              </View>

              <View style={styles.macroItem}>
                <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Fat</Text>
                <View style={[styles.macroBar, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={[styles.macroProgress, { 
                    backgroundColor: getMacroColor(totalFat, fatGoal),
                    width: `${Math.min((totalFat / fatGoal) * 100, 100)}%`
                  }]} />
                </View>
                <Text style={[styles.macroValue, { color: theme.colors.text }]}>{totalFat}g</Text>
              </View>
            </View>
          </Surface>
        </Pressable>

        {/* Water Intake */}
        <WaterIntake />

        {renderHistorySection()}

        <TodaysMeals
          visible={mealsModalVisible}
          onDismiss={() => setMealsModalVisible(false)}
          meals={formattedMeals}
          totalCalories={totalCalories}
          calorieGoal={calorieGoal}
        />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 0, // Remove bottom padding since containers have their own margins
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
    padding: 4,
  },
  appTitle: {
    fontWeight: 'bold',
    fontSize: 32,
  },
  greeting: {
    fontSize: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  quoteContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  dailyOverview: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
  },
  caloriesSection: {
    marginBottom: 32,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calorieTitle: {
    fontSize: 24,
    fontWeight: '500',
  },
  caloriePercentage: {
    fontSize: 24,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  calorieValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consumedText: {
    fontSize: 16,
  },
  remainingText: {
    fontSize: 16,
  },
  macrosContainer: {
    gap: 20,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroLabel: {
    width: 60,
    fontSize: 16,
    fontWeight: '500',
  },
  macroBar: {
    flex: 1,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  macroProgress: {
    height: '100%',
    borderRadius: 12,
  },
  macroValue: {
    width: 40,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  historyContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  historyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 20,
  },
  historyBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  historyBarWrapper: {
    width: 20,
    height: 150,
    justifyContent: 'flex-end',
  },
  historyBar: {
    width: '100%',
    borderRadius: 10,
    minHeight: 20,
  },
  historyBarLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  historyBarValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  historyStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  historyStatLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyStatValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyHeader: {
    marginBottom: 20,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  macroCardsContainer: {
    gap: 16,
  },
  macroCard: {
    padding: 16,
    borderRadius: 12,
  },
  macroCardLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  macroCardValue: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroCardGoal: {
    fontSize: 14,
  },
  modalButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  modalButtonContent: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },
}); 