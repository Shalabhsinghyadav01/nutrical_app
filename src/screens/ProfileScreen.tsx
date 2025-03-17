import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useUser, UserProfile } from '../context/UserContext';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Tooltip, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import UnitInput from '../components/UnitInput';
import { useTheme } from '../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TooltipData {
  [key: string]: string;
}

const tooltips: TooltipData = {
  name: "Enter your full name as you'd like it to appear in the app",
  age: "Your age helps us calculate your metabolic rate accurately",
  gender: "Your biological sex is used for metabolic calculations",
  weight: "Your current weight in kilograms",
  height: "Your height in centimeters",
  activityLevel: "Choose based on your typical weekly exercise routine",
  goal: "Select your primary fitness goal",
  goalIntensity: "How quickly you want to achieve your goal",
  dietaryPreference: "Your preferred diet type affects macro recommendations"
};

const ProfileScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { userProfile, setUserProfile, calculateNutritionGoals } = useUser();
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 0,
    gender: 'male',
    weight: 0,
    height: 0,
    activityLevel: 'sedentary',
    goal: 'maintain',
    goalIntensity: 'moderate',
    dietaryPreference: 'standard',
  });

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const updateForm = (key: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.name?.trim()) {
          Alert.alert('Error', 'Please enter your name');
          return false;
        }
        if (!formData.age || formData.age < 13 || formData.age > 100) {
          Alert.alert('Error', 'Please enter a valid age between 13 and 100');
          return false;
        }
        break;
      case 2:
        if (!formData.weight || formData.weight < 30 || formData.weight > 300) {
          Alert.alert('Error', 'Please enter a valid weight between 30 and 300 kg');
          return false;
        }
        if (!formData.height || formData.height < 100 || formData.height > 250) {
          Alert.alert('Error', 'Please enter a valid height between 100 and 250 cm');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else if (!showPreview) {
      setShowPreview(true);
    } else {
      // Calculate nutrition goals and save profile
      const goals = calculateNutritionGoals(formData);
      const completeProfile: UserProfile = {
        ...formData,
        calorieGoal: goals.calories,
        proteinGoal: goals.protein,
        carbsGoal: goals.carbs,
        fatGoal: goals.fat,
      } as UserProfile;
      
      setUserProfile(completeProfile);
      
      // Navigate based on where we came from
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('Dashboard');
      }
    }
  };

  const handleBack = () => {
    if (showPreview) {
      setShowPreview(false);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderTooltip = (field: string) => (
    <Tooltip title={tooltips[field]} enterTouchDelay={50} leaveTouchDelay={200}>
      <TouchableOpacity style={styles.tooltipIcon}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </Tooltip>
  );

  const renderBasicInfo = () => (
    <View style={styles.formSection}>
      <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
      <View style={styles.inputContainer}>
        {renderTooltip('name')}
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }]}
          placeholder="Your Name"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.name}
          onChangeText={(value) => updateForm('name', value)}
        />
      </View>
      <View style={styles.inputContainer}>
        {renderTooltip('age')}
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }]}
          placeholder="Age"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          value={formData.age?.toString()}
          onChangeText={(value) => updateForm('age', parseInt(value) || 0)}
        />
      </View>
      <View style={styles.pickerContainer}>
        {renderTooltip('gender')}
        <Text style={[styles.label, { color: theme.colors.text }]}>Gender</Text>
        <Picker
          selectedValue={formData.gender}
          onValueChange={(value) => updateForm('gender', value)}
          style={[styles.picker, { 
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.text
          }]}
        >
          <Picker.Item label="Male" value="male" color={theme.colors.text} />
          <Picker.Item label="Female" value="female" color={theme.colors.text} />
        </Picker>
      </View>
    </View>
  );

  const renderBodyMetrics = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Body Metrics</Text>
      <View style={styles.inputContainer}>
        {renderTooltip('weight')}
        <UnitInput
          type="weight"
          value={formData.weight}
          onValueChange={(value) => updateForm('weight', value)}
          style={styles.unitInput}
        />
      </View>
      <View style={styles.inputContainer}>
        {renderTooltip('height')}
        <UnitInput
          type="height"
          value={formData.height}
          onValueChange={(value) => updateForm('height', value)}
          style={styles.unitInput}
        />
      </View>
    </View>
  );

  const renderActivityLevel = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Activity Level</Text>
      <View style={styles.pickerContainer}>
        {renderTooltip('activityLevel')}
        <Text style={styles.label}>Activity Level</Text>
        <Picker
          selectedValue={formData.activityLevel}
          onValueChange={(value) => updateForm('activityLevel', value)}
          style={styles.picker}
        >
          <Picker.Item label="Sedentary (little or no exercise)" value="sedentary" />
          <Picker.Item label="Light (exercise 1-3 days/week)" value="light" />
          <Picker.Item label="Moderate (exercise 3-5 days/week)" value="moderate" />
          <Picker.Item label="Active (exercise 6-7 days/week)" value="active" />
          <Picker.Item label="Very Active (intense exercise daily)" value="very_active" />
        </Picker>
      </View>
    </View>
  );

  const renderGoals = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Your Goals</Text>
      <View style={styles.pickerContainer}>
        {renderTooltip('goal')}
        <Text style={styles.label}>Goal</Text>
        <Picker
          selectedValue={formData.goal}
          onValueChange={(value) => updateForm('goal', value)}
          style={styles.picker}
        >
          <Picker.Item label="Lose Weight" value="lose" />
          <Picker.Item label="Maintain Weight" value="maintain" />
          <Picker.Item label="Gain Weight" value="gain" />
        </Picker>
      </View>

      {formData.goal !== 'maintain' && (
        <View style={styles.pickerContainer}>
          {renderTooltip('goalIntensity')}
          <Text style={styles.label}>Goal Intensity</Text>
          <Picker
            selectedValue={formData.goalIntensity}
            onValueChange={(value) => updateForm('goalIntensity', value)}
            style={styles.picker}
          >
            <Picker.Item label="Slow" value="slow" />
            <Picker.Item label="Moderate" value="moderate" />
            <Picker.Item label="Aggressive" value="aggressive" />
          </Picker>
        </View>
      )}

      <View style={styles.pickerContainer}>
        {renderTooltip('dietaryPreference')}
        <Text style={styles.label}>Dietary Preference</Text>
        <Picker
          selectedValue={formData.dietaryPreference}
          onValueChange={(value) => updateForm('dietaryPreference', value)}
          style={styles.picker}
        >
          <Picker.Item label="Standard" value="standard" />
          <Picker.Item label="Vegetarian" value="vegetarian" />
          <Picker.Item label="Vegan" value="vegan" />
          <Picker.Item label="Keto" value="keto" />
          <Picker.Item label="Paleo" value="paleo" />
        </Picker>
      </View>
    </View>
  );

  const renderPreview = () => {
    const goals = calculateNutritionGoals(formData);
    return (
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Your Calculated Goals</Text>
        <View style={styles.previewContainer}>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Daily Calories</Text>
            <Text style={styles.previewValue}>{goals.calories} kcal</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Protein</Text>
            <Text style={styles.previewValue}>{goals.protein}g</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Carbs</Text>
            <Text style={styles.previewValue}>{goals.carbs}g</Text>
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Fat</Text>
            <Text style={styles.previewValue}>{goals.fat}g</Text>
          </View>
        </View>
        <Text style={styles.previewNote}>
          These goals are calculated based on your profile information and can be adjusted later.
        </Text>
      </View>
    );
  };

  // If profile is already complete, show a summary view with edit button
  if (userProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
          
          <Surface style={[styles.summarySection, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Name</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.name}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Age</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.age} years</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Gender</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.gender}</Text>
            </View>
          </Surface>

          <Surface style={[styles.summarySection, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Body Metrics</Text>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Weight</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.weight} kg</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Height</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.height} cm</Text>
            </View>
          </Surface>

          <Surface style={[styles.summarySection, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Goals & Preferences</Text>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Activity Level</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.activityLevel}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Goal</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.goal}</Text>
            </View>
            {userProfile.goalIntensity && (
              <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Goal Intensity</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.goalIntensity}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Diet Type</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{userProfile.dietaryPreference}</Text>
            </View>
          </Surface>

          <Surface style={[styles.summarySection, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Targets</Text>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Calories</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{userProfile.calorieGoal} kcal</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Protein</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{userProfile.proteinGoal}g</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Carbs</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{userProfile.carbsGoal}g</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Fat</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{userProfile.fatGoal}g</Text>
            </View>
          </Surface>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={[styles.editButtonText, { color: theme.colors.surface }]}>Edit Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.text }]}>Profile Setup</Text>
        <Text style={[styles.stepIndicator, { color: theme.colors.textSecondary }]}>
          {showPreview ? 'Preview' : `Step ${step} of 4`}
        </Text>

        {!showPreview ? (
          <>
            {step === 1 && renderBasicInfo()}
            {step === 2 && renderBodyMetrics()}
            {step === 3 && renderActivityLevel()}
            {step === 4 && renderGoals()}
          </>
        ) : (
          renderPreview()
        )}

        <View style={styles.buttonContainer}>
          {(step > 1 || showPreview) && (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.colors.surfaceVariant }]} 
              onPress={handleBack}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handleNext}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText, { color: theme.colors.surface }]}>
              {showPreview ? 'Complete' : step === 4 ? 'Preview' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepIndicator: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tooltipIcon: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    ...Platform.select({
      ios: {
        borderRadius: 8,
      },
      android: {},
    }),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  primaryButtonText: {
    fontWeight: '600',
  },
  previewContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  previewLabel: {
    fontSize: 16,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewNote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  unitInput: {
    flex: 1,
  },
  summarySection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 