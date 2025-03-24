import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Portal, Modal, ProgressBar } from 'react-native-paper';

interface Meal {
  name: string;
  time: string;
  cuisine: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface TodaysMealsProps {
  visible: boolean;
  onDismiss: () => void;
  meals: Meal[];
  totalCalories: number;
  calorieGoal: number;
}

function CalorieDetailItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.calorieDetailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MacroItem({ label, value, goal, color }: { 
  label: string; 
  value: number;
  goal: number;
  color: string;
}) {
  const progress = value / goal;
  
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroPercentage, { color }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <ProgressBar 
        progress={progress}
        color={color}
        style={styles.macroProgress}
      />
      <Text style={styles.macroValue}>
        {value}g of {goal}g
      </Text>
    </View>
  );
}

export default function TodaysMeals({ visible, onDismiss, meals, totalCalories, calorieGoal }: TodaysMealsProps) {
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);

  // Get current date in local timezone
  const now = new Date();
  const today = now.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Goals (these could come from user settings in the future)
  const proteinGoal = 150;
  const carbsGoal = 300;
  const fatGoal = 70;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Surface style={styles.surface} elevation={4}>
            <View style={styles.modalHeader}>
              <View>
                <Text variant="headlineMedium" style={styles.title}>Today's Meals</Text>
                <Text style={styles.dateText}>{today}</Text>
              </View>
              <Text onPress={onDismiss} style={styles.closeButton}>✕</Text>
            </View>

            {/* Calories Section */}
            <View style={styles.caloriesSection}>
              <View style={styles.calorieHeader}>
                <Text style={styles.calorieTitle}>Calories</Text>
                <Text style={[styles.caloriePercentage, styles.greenText]}>
                  {Math.round((totalCalories / calorieGoal) * 100)}%
                </Text>
              </View>
              <ProgressBar 
                progress={totalCalories / calorieGoal}
                color="#4CAF50"
                style={styles.progressBar}
              />
              <View style={styles.calorieDetails}>
                <CalorieDetailItem label="Goal" value={calorieGoal} />
                <CalorieDetailItem label="Consumed" value={totalCalories} />
                <CalorieDetailItem label="Remaining" value={calorieGoal - totalCalories} />
              </View>
            </View>

            {/* Macros Section */}
            <View style={styles.macrosContainer}>
              <MacroItem 
                label="Protein"
                value={totalProtein}
                goal={proteinGoal}
                color="#FF6B6B"
              />
              <MacroItem 
                label="Carbs"
                value={totalCarbs}
                goal={carbsGoal}
                color="#4ECDC4"
              />
              <MacroItem 
                label="Fat"
                value={totalFat}
                goal={fatGoal}
                color="#45B7D1"
              />
            </View>

            {/* Meals List */}
            <View style={styles.mealsListContainer}>
              <Text style={styles.mealsListTitle}>Meals</Text>
              <View style={styles.mealsList}>
                {meals.map((meal, index) => (
                  <View key={index} style={styles.mealContainer}>
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                    </View>
                    
                    <View style={styles.mealDetails}>
                      <View style={styles.timeAndCuisine}>
                        <Text style={styles.mealTime}>{meal.time}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.cuisine}>{meal.cuisine}</Text>
                      </View>
                      
                      <View style={styles.macros}>
                        <Text style={styles.macroText}>P: {meal.protein}g</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.macroText}>C: {meal.carbs}g</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.macroText}>F: {meal.fat}g</Text>
                      </View>
                    </View>

                    {index < meals.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </Surface>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    marginTop: 60,
    marginBottom: 60,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
  },
  scrollView: {
    maxHeight: '100%',
  },
  surface: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 24,
    color: '#666666',
    padding: 8,
  },
  caloriesSection: {
    marginBottom: 24,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calorieTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  caloriePercentage: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  calorieDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calorieDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  macrosContainer: {
    gap: 16,
    marginBottom: 24,
  },
  macroItem: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  macroPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroProgress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  macroValue: {
    fontSize: 14,
    color: '#666666',
  },
  greenText: {
    color: '#4CAF50',
  },
  mealsListContainer: {
    marginTop: 8,
  },
  mealsList: {
    paddingBottom: 16,
  },
  mealsListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  mealContainer: {
    paddingVertical: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  mealCalories: {
    fontSize: 16,
    color: '#666666',
  },
  mealDetails: {
    gap: 4,
  },
  timeAndCuisine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: 14,
    color: '#666666',
  },
  dot: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 8,
  },
  cuisine: {
    fontSize: 14,
    color: '#666666',
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroText: {
    fontSize: 14,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
}); 