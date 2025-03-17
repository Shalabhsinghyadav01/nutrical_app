import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, SegmentedButtons } from 'react-native-paper';
import { Cuisine, FoodItem } from '../types/nutrition';
import { aiService } from '../services/aiService';

export default function CalculatorScreen() {
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine>('Other');
  const [analyzedFood, setAnalyzedFood] = useState<FoodItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const cuisineOptions = [
    { label: 'Indian', value: 'Indian' },
    { label: 'Chinese', value: 'Chinese' },
    { label: 'Italian', value: 'Italian' },
    { label: 'Japanese', value: 'Japanese' },
    { label: 'Mediterranean', value: 'Mediterranean' },
    { label: 'Mexican', value: 'Mexican' },
    { label: 'American', value: 'American' },
    { label: 'Thai', value: 'Thai' },
    { label: 'Other', value: 'Other' },
  ];

  const analyzeFood = async () => {
    if (!foodName || !portion) return;

    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeFoodItem(
        foodName,
        cuisine,
        Number(portion)
      );
      setAnalyzedFood(result);
    } catch (error) {
      console.error('Error analyzing food:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            AI Food Calculator
          </Text>
          
          <TextInput
            label="Food Name"
            value={foodName}
            onChangeText={setFoodName}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Portion (in grams)"
            value={portion}
            onChangeText={setPortion}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />

          <Text variant="bodyMedium" style={styles.label}>
            Select Cuisine Type
          </Text>
          
          <SegmentedButtons
            value={cuisine}
            onValueChange={setCuisine as any}
            buttons={cuisineOptions}
            style={styles.cuisineButtons}
          />

          <Button
            mode="contained"
            onPress={analyzeFood}
            loading={isAnalyzing}
            style={styles.button}
          >
            Analyze Food
          </Button>

          {analyzedFood && (
            <Card style={styles.resultCard}>
              <Card.Content>
                <Text variant="titleMedium">Analysis Results</Text>
                <View style={styles.resultRow}>
                  <Text>Calories:</Text>
                  <Text>{analyzedFood.calories} kcal</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text>Protein:</Text>
                  <Text>{analyzedFood.protein}g</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text>Carbs:</Text>
                  <Text>{analyzedFood.carbs}g</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text>Fats:</Text>
                  <Text>{analyzedFood.fats}g</Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  cuisineButtons: {
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  button: {
    marginVertical: 16,
  },
  resultCard: {
    marginTop: 16,
    backgroundColor: '#f8f8f8',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
}); 