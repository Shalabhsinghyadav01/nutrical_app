import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, SegmentedButtons, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { saveProfile, getCurrentUser } from '../lib/supabase';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  MainTabs: undefined;
  ProfileSetup: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export default function ProfileSetupScreen() {
  const { theme } = useTheme();
  const { userProfile, setUserProfile } = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    height: '', // in cm
    weight: '', // in kg
    activity_level: 'sedentary',
    goal: 'maintain'
  });

  const activityLevels = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const calculateGoals = () => {
    const age = parseInt(formData.age);
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const activityMultiplier = activityLevels[formData.activity_level as keyof typeof activityLevels];
    
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (formData.gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Calculate TDEE (Total Daily Energy Expenditure)
    let calorie_goal = Math.round(bmr * activityMultiplier);

    // Adjust calories based on goal
    switch (formData.goal) {
      case 'lose':
        calorie_goal -= 500; // Create a deficit
        break;
      case 'gain':
        calorie_goal += 500; // Create a surplus
        break;
    }

    // Calculate macros
    const protein_goal = Math.round(weight * 2.2); // 1g per lb of body weight
    const fat_goal = Math.round((calorie_goal * 0.25) / 9); // 25% of calories from fat
    const carbs_goal = Math.round((calorie_goal - (protein_goal * 4) - (fat_goal * 9)) / 4);
    
    return {
      calorie_goal,
      protein_goal,
      carbs_goal,
      fat_goal,
      water_goal: 8 // Default to 8 glasses
    };
  };

  const handleSave = async () => {
    if (!formData.name || !formData.age || !formData.height || !formData.weight) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const goals = calculateGoals();
      const profileData = {
        id: user.id,
        email: user.email,
        ...formData,
        ...goals,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight)
      };

      const updatedProfile = await saveProfile(profileData);
      setUserProfile({ ...userProfile, ...updatedProfile });
      
      // Navigate to MainTabs using replace instead of reset
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Text variant="titleMedium" style={styles.label}>What's your name?</Text>
            <TextInput
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              style={styles.input}
              mode="outlined"
            />
          </>
        );
      case 1:
        return (
          <>
            <Text variant="titleMedium" style={styles.label}>What's your gender?</Text>
            <RadioButton.Group
              onValueChange={value => setFormData(prev => ({ ...prev, gender: value }))}
              value={formData.gender}
            >
              <View style={styles.radioGroup}>
                <RadioButton.Item label="Male" value="male" />
                <RadioButton.Item label="Female" value="female" />
              </View>
            </RadioButton.Group>
          </>
        );
      case 2:
        return (
          <>
            <Text variant="titleMedium" style={styles.label}>What's your age?</Text>
            <TextInput
              label="Age"
              value={formData.age}
              onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
          </>
        );
      case 3:
        return (
          <>
            <Text variant="titleMedium" style={styles.label}>What's your height (cm)?</Text>
            <TextInput
              label="Height"
              value={formData.height}
              onChangeText={(text) => setFormData(prev => ({ ...prev, height: text }))}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
          </>
        );
      case 4:
        return (
          <>
            <Text variant="titleMedium" style={styles.label}>What's your weight (kg)?</Text>
            <TextInput
              label="Weight"
              value={formData.weight}
              onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
          </>
        );
      case 5:
        return (
          <>
            <Text variant="titleMedium" style={styles.label}>What's your activity level?</Text>
            <SegmentedButtons
              value={formData.activity_level}
              onValueChange={value => setFormData(prev => ({ ...prev, activity_level: value }))}
              buttons={[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'light', label: 'Light' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'active', label: 'Active' },
                { value: 'very_active', label: 'Very Active' }
              ]}
              style={styles.segmentedButtons}
            />
          </>
        );
      case 6:
        return (
          <>
            <Text variant="titleMedium" style={styles.label}>What's your goal?</Text>
            <SegmentedButtons
              value={formData.goal}
              onValueChange={value => setFormData(prev => ({ ...prev, goal: value }))}
              buttons={[
                { value: 'lose', label: 'Lose Weight' },
                { value: 'maintain', label: 'Maintain' },
                { value: 'gain', label: 'Gain Weight' }
              ]}
              style={styles.segmentedButtons}
            />
          </>
        );
    }
  };

  const totalSteps = 7;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Welcome to NutriCal!
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Let's personalize your experience
          </Text>
        </Surface>

        <Surface style={[styles.form, { backgroundColor: theme.colors.surface }]} elevation={1}>
          {renderStep()}

          <View style={styles.buttonContainer}>
            {currentStep > 0 && (
              <Button
                mode="outlined"
                onPress={() => setCurrentStep(prev => prev - 1)}
                style={styles.navigationButton}
              >
                Back
              </Button>
            )}
            
            {currentStep < totalSteps - 1 ? (
              <Button
                mode="contained"
                onPress={() => setCurrentStep(prev => prev + 1)}
                style={styles.navigationButton}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.navigationButton}
              >
                Complete Setup
              </Button>
            )}
          </View>
        </Surface>
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
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  label: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navigationButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
  },
}); 