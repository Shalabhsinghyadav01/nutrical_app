import React from 'react';
import { View, StyleSheet } from 'react-native';
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
        <Surface style={styles.surface} elevation={2}>
          <Text variant="headlineMedium" style={styles.title}>Today's Meals</Text>

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
          <View style={styles.mealsList}>
            <Text style={styles.mealsListTitle}>Meals</Text>
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
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
  },
  surface: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 24,
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
  mealsList: {
    gap: 16,
  },
  mealsListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  mealContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
    flexWrap: 'wrap',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
    minWidth: 70,
    textAlign: 'right',
  },
  mealDetails: {
    gap: 8,
  },
  timeAndCuisine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  mealTime: {
    fontSize: 14,
    color: '#666666',
  },
  cuisine: {
    fontSize: 14,
    color: '#666666',
    textTransform: 'capitalize',
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  macroText: {
    fontSize: 14,
    color: '#666666',
  },
  dot: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
}); 