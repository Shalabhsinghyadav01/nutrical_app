import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useUser, UserProfile } from '../context/UserContext';
import { Picker } from '@react-native-picker/picker';
import UnitInput from '../components/UnitInput';
import { useTheme } from '../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EditProfileScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, setUserProfile, calculateNutritionGoals } = useUser();
  const [formData, setFormData] = useState<UserProfile>({
    ...userProfile!,
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Edit Profile',
      headerStyle: {
        backgroundColor: theme.colors.surface,
      },
      headerTintColor: theme.colors.text,
    });
  }, [navigation, theme]);

  const updateForm = (key: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Calculate new nutrition goals
    const goals = calculateNutritionGoals(formData);
    const updatedProfile: UserProfile = {
      ...formData,
      calorieGoal: goals.calories,
      proteinGoal: goals.protein,
      carbsGoal: goals.carbs,
      fatGoal: goals.fat,
    };

    // Show confirmation if goals have changed significantly
    const calorieChange = Math.abs(updatedProfile.calorieGoal - userProfile!.calorieGoal);
    if (calorieChange > 100 && !showConfirmation) {
      setShowConfirmation(true);
      Alert.alert(
        'Update Goals?',
        'Your nutrition goals will be updated based on your changes. Would you like to proceed?',
        [
          {
            text: 'Review Changes',
            style: 'cancel',
            onPress: () => setShowConfirmation(false),
          },
          {
            text: 'Save',
            onPress: () => {
              setUserProfile(updatedProfile);
              navigation.goBack();
            },
          },
        ]
      );
      return;
    }

    setUserProfile(updatedProfile);
    navigation.goBack();
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {children}
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {renderSection('Body Metrics', (
          <>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Weight</Text>
            <UnitInput
              type="weight"
              value={formData.weight}
              onValueChange={(value) => updateForm('weight', value)}
              style={styles.input}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Height</Text>
            <UnitInput
              type="height"
              value={formData.height}
              onValueChange={(value) => updateForm('height', value)}
              style={styles.input}
            />
          </>
        ))}

        {renderSection('Activity & Goals', (
          <>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Activity Level</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Picker
                selectedValue={formData.activityLevel}
                onValueChange={(value) => updateForm('activityLevel', value)}
                style={[styles.picker, { color: theme.colors.text }]}
              >
                <Picker.Item label="Sedentary (little or no exercise)" value="sedentary" color={theme.colors.text} />
                <Picker.Item label="Light (exercise 1-3 days/week)" value="light" color={theme.colors.text} />
                <Picker.Item label="Moderate (exercise 3-5 days/week)" value="moderate" color={theme.colors.text} />
                <Picker.Item label="Active (exercise 6-7 days/week)" value="active" color={theme.colors.text} />
                <Picker.Item label="Very Active (intense exercise daily)" value="very_active" color={theme.colors.text} />
              </Picker>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Goal</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Picker
                selectedValue={formData.goal}
                onValueChange={(value) => updateForm('goal', value)}
                style={[styles.picker, { color: theme.colors.text }]}
              >
                <Picker.Item label="Lose Weight" value="lose" color={theme.colors.text} />
                <Picker.Item label="Maintain Weight" value="maintain" color={theme.colors.text} />
                <Picker.Item label="Gain Weight" value="gain" color={theme.colors.text} />
              </Picker>
            </View>

            {formData.goal !== 'maintain' && (
              <>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Goal Intensity</Text>
                <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Picker
                    selectedValue={formData.goalIntensity}
                    onValueChange={(value) => updateForm('goalIntensity', value)}
                    style={[styles.picker, { color: theme.colors.text }]}
                  >
                    <Picker.Item label="Slow" value="slow" color={theme.colors.text} />
                    <Picker.Item label="Moderate" value="moderate" color={theme.colors.text} />
                    <Picker.Item label="Aggressive" value="aggressive" color={theme.colors.text} />
                  </Picker>
                </View>
              </>
            )}
          </>
        ))}

        {renderSection('Dietary Preferences', (
          <>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Diet Type</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Picker
                selectedValue={formData.dietaryPreference}
                onValueChange={(value) => updateForm('dietaryPreference', value)}
                style={[styles.picker, { color: theme.colors.text }]}
              >
                <Picker.Item label="Standard" value="standard" color={theme.colors.text} />
                <Picker.Item label="Vegetarian" value="vegetarian" color={theme.colors.text} />
                <Picker.Item label="Vegan" value="vegan" color={theme.colors.text} />
                <Picker.Item label="Keto" value="keto" color={theme.colors.text} />
                <Picker.Item label="Paleo" value="paleo" color={theme.colors.text} />
              </Picker>
            </View>
          </>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.surface }]}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    ...Platform.select({
      ios: {},
      android: {},
    }),
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen; 