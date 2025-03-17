import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { Text, Surface, SegmentedButtons, TextInput, Button, Menu, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useMeals } from '../context/MealsContext';
import { useUser } from '../context/UserContext';
import { processName } from '../utils/transliteration';
import { analyzeMealWithDeepSeek, analyzeMealImageWithDeepSeek, testDeepSeekConnection } from '../services/deepSeekService';
import { useTheme } from '../context/ThemeContext';

export default function AddMealScreen({ navigation }) {
  const { theme } = useTheme();
  const { addMeal, meals } = useMeals();
  const { userProfile } = useUser();
  
  // Hide the navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide the default header
    });
  }, [navigation]);

  const [inputMethod, setInputMethod] = useState('manual');
  const [image, setImage] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [transliteratedName, setTransliteratedName] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('other');
  const [portionSize, setPortionSize] = useState('Medium');
  const [portionMenuVisible, setPortionMenuVisible] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [detectedMealType, setDetectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);

  // Add calculations for total calories using user profile
  const calorieGoal = userProfile?.calorieGoal || 2400; // Fallback to 2400 if profile not set
  const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const remainingCalories = calorieGoal - totalCalories;
  const calorieProgress = Math.min(totalCalories / calorieGoal, 1);
  const caloriePercentage = Math.round(calorieProgress * 100);

  const cuisineTypes = [
    { label: 'American', value: 'american' },
    { label: 'Italian', value: 'italian' },
    { label: 'Mexican', value: 'mexican' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'Indian', value: 'indian' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Mediterranean', value: 'mediterranean' },
    { label: 'Thai', value: 'thai' },
    { label: 'French', value: 'french' },
    { label: 'Greek', value: 'greek' },
  ];

  const portionSizes = [
    'Small',
    'Medium',
    'Large',
    'Extra Large'
  ];

  useEffect(() => {
    async function checkApiConnection() {
      try {
        const isConnected = await testDeepSeekConnection();
        setApiStatus(isConnected ? 'connected' : 'error');
        if (!isConnected) {
          setError('Failed to connect to DeepSeek API. Please check your API key.');
        }
      } catch (err) {
        console.error('API connection test error:', err);
        setApiStatus('error');
        setError('Failed to connect to DeepSeek API. Please check your API key.');
      }
    }

    checkApiConnection();
  }, []);

  const handleImageAnalysis = async (imageUri: string) => {
    try {
      setIsCalculating(true);
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await analyzeMealImageWithDeepSeek(base64);
      
      setMealName(result.mealName);
      setSelectedCuisine(result.cuisine.toLowerCase());
      setCalories(result.nutrition.calories.toString());
      setProtein(result.nutrition.protein.toString());
      setCarbs(result.nutrition.carbs.toString());
      setFat(result.nutrition.fat.toString());
    } catch (error) {
      setError('Failed to analyze image. Please try again.');
      console.error('Error analyzing image:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await handleImageAnalysis(result.assets[0].uri);
    }
  };

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("You need to grant camera permission to use this feature");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await handleImageAnalysis(result.assets[0].uri);
    }
  };

  const handleMealNameChange = async (text: string) => {
    setMealName(text);
    const result = await processName(text);
    setTransliteratedName(result.transliterated);
  };

  const validateBasicForm = () => {
    if (!mealName.trim()) {
      setError('Please enter a meal name');
      return false;
    }
    setError(null);
    return true;
  };

  const calculateMacros = async () => {
    if (!validateBasicForm()) return;

    setIsCalculating(true);
    try {
      const result = await analyzeMealWithDeepSeek(
        mealName,
        selectedCuisine,
        portionSize
      );

      setCalories(result.calories.toString());
      setProtein(result.protein.toString());
      setCarbs(result.carbs.toString());
      setFat(result.fat.toString());
    } catch (error) {
      setError('Failed to calculate nutrition information. Please try again.');
      console.error('Error calculating macros:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleProcessDescription = async () => {
    if (!mealDescription.trim()) {
      setError('Please enter a meal description');
      return;
    }

    setIsCalculating(true);
    try {
      const result = await analyzeMealWithDeepSeek(
        mealDescription,
        selectedCuisine,
        portionSize
      );
      
      // Set the extracted dish name
      setMealName(result.dishName);
      
      // Set the detected cuisine if available
      if (result.cuisine !== 'other') {
        setSelectedCuisine(result.cuisine);
      }
      
      // Set nutrition values
      setCalories(result.nutrition.calories.toString());
      setProtein(result.nutrition.protein.toString());
      setCarbs(result.nutrition.carbs.toString());
      setFat(result.nutrition.fat.toString());

      // Store the detected meal type for use when adding the meal
      setDetectedMealType(result.mealType);
      
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error processing description:', error);
      setError('Failed to process description. Please try again or use manual entry.');
    } finally {
      setIsCalculating(false);
    }
  };

  const clearForm = () => {
    setMealName('');
    setTransliteratedName(null);
    setSelectedCuisine('other');
    setPortionSize('Medium');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setImage(null);
    setMealDescription('');
    setDetectedMealType(null); // Clear detected meal type
    setError(null);
  };

  const handleAddMeal = async () => {
    if (!validateBasicForm()) return;

    // If macros haven't been calculated yet, calculate them
    if (!calories || !protein || !carbs || !fat) {
      setIsCalculating(true);
      try {
        const result = await analyzeMealWithDeepSeek(
          mealName,
          selectedCuisine,
          portionSize
        );
        
        // Validate the response data
        if (!result || !result.nutrition) {
          throw new Error('Invalid response from nutrition calculation');
        }

        // Safely convert values to string, defaulting to '0' if undefined
        const calculatedCalories = (result.nutrition.calories || 0).toString();
        const calculatedProtein = (result.nutrition.protein || 0).toString();
        const calculatedCarbs = (result.nutrition.carbs || 0).toString();
        const calculatedFat = (result.nutrition.fat || 0).toString();

        // Show confirmation popup with calculated macros
        Alert.alert(
          'Meal Nutrition Info',
          `Calories: ${calculatedCalories} kcal\nProtein: ${calculatedProtein}g\nCarbs: ${calculatedCarbs}g\nFat: ${calculatedFat}g`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Add Meal',
              onPress: () => {
                // Add meal with calculated macros
                const newMeal = {
                  id: Date.now().toString(),
                  name: mealName,
                  dateTime: new Date().toISOString(),
                  type: detectedMealType || getCurrentMealType(),
                  foods: [{
                    id: Date.now().toString(),
                    name: mealName,
                    portion: 1,
                    unit: 'serving',
                    calories: parseInt(calculatedCalories) || 0,
                    protein: parseInt(calculatedProtein) || 0,
                    carbs: parseInt(calculatedCarbs) || 0,
                    fat: parseInt(calculatedFat) || 0,
                    imageUrl: image || undefined
                  }],
                  totalCalories: parseInt(calculatedCalories) || 0,
                  totalProtein: parseInt(calculatedProtein) || 0,
                  totalCarbs: parseInt(calculatedCarbs) || 0,
                  totalFat: parseInt(calculatedFat) || 0,
                  cuisine: selectedCuisine,
                  imageUrl: image || undefined
                };

                addMeal(newMeal);
                clearForm();
                navigation.navigate('DashboardTab');
              }
            }
          ]
        );
      } catch (error) {
        console.error('Error calculating macros:', error);
        setError('Failed to calculate nutrition information. Please try again.');
      } finally {
        setIsCalculating(false);
      }
      return;
    }

    // If macros are already calculated, show confirmation popup
    Alert.alert(
      'Meal Nutrition Info',
      `Calories: ${calories} kcal\nProtein: ${protein}g\nCarbs: ${carbs}g\nFat: ${fat}g`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Add Meal',
          onPress: () => {
            const newMeal = {
              id: Date.now().toString(),
              name: mealName,
              dateTime: new Date().toISOString(),
              type: detectedMealType || getCurrentMealType(),
              foods: [{
                id: Date.now().toString(),
                name: mealName,
                portion: 1,
                unit: 'serving',
                calories: parseInt(calories) || 0,
                protein: parseInt(protein) || 0,
                carbs: parseInt(carbs) || 0,
                fat: parseInt(fat) || 0,
                imageUrl: image || undefined
              }],
              totalCalories: parseInt(calories) || 0,
              totalProtein: parseInt(protein) || 0,
              totalCarbs: parseInt(carbs) || 0,
              totalFat: parseInt(fat) || 0,
              cuisine: selectedCuisine,
              imageUrl: image || undefined
            };

            addMeal(newMeal);
            clearForm();
            navigation.navigate('DashboardTab');
          }
        }
      ]
    );
  };

  // Helper function to determine meal type based on current time
  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 16) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  };

  const renderManualInput = () => (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.text }]}>Add Meal</Text>
      <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Enter your meal details and let AI calculate the nutrition information.
      </Text>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      )}

      <View style={styles.inputSection}>
        <Text variant="titleMedium" style={[styles.inputLabel, { color: theme.colors.text }]}>Meal Name*</Text>
        <TextInput
          mode="outlined"
          placeholder="Enter meal name (supports Hindi)"
          value={mealName}
          onChangeText={handleMealNameChange}
          style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
          outlineStyle={styles.inputOutline}
          textColor={theme.colors.text}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {transliteratedName && (
          <Text style={[styles.transliteratedText, { color: theme.colors.textSecondary }]}>
            Transliterated: {transliteratedName}
          </Text>
        )}
      </View>

      <View style={styles.inputSection}>
        <Text variant="titleMedium" style={[styles.inputLabel, { color: theme.colors.text }]}>Cuisine Type</Text>
        <View style={styles.cuisineGrid}>
          {cuisineTypes.map((cuisine) => (
            <Pressable
              key={cuisine.value}
              style={[
                styles.cuisineButton,
                { 
                  backgroundColor: selectedCuisine === cuisine.value ? theme.colors.primary : theme.colors.surface,
                  borderColor: selectedCuisine === cuisine.value ? theme.colors.primary : theme.colors.surfaceVariant
                }
              ]}
              onPress={() => setSelectedCuisine(cuisine.value)}
            >
              <Text style={[
                styles.cuisineButtonText,
                { color: selectedCuisine === cuisine.value ? theme.colors.surface : theme.colors.text }
              ]}>
                {cuisine.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text variant="titleMedium" style={[styles.inputLabel, { color: theme.colors.text }]}>Portion Size</Text>
        <Menu
          visible={portionMenuVisible}
          onDismiss={() => setPortionMenuVisible(false)}
          anchor={
            <Pressable 
              style={[styles.portionSelect, { 
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.border
              }]}
              onPress={() => setPortionMenuVisible(true)}
            >
              <Text style={[styles.portionText, { color: theme.colors.text }]}>{portionSize}</Text>
              <MaterialCommunityIcons 
                name={portionMenuVisible ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={theme.colors.textSecondary}
              />
            </Pressable>
          }
          contentStyle={[styles.menuContent, { backgroundColor: theme.colors.surface }]}
        >
          {portionSizes.map((size) => (
            <Menu.Item
              key={size}
              onPress={() => {
                setPortionSize(size);
                setPortionMenuVisible(false);
              }}
              title={size}
              titleStyle={[
                styles.menuItemText,
                { color: portionSize === size ? theme.colors.primary : theme.colors.text }
              ]}
            />
          ))}
        </Menu>
      </View>

      <Button
        mode="contained"
        onPress={calculateMacros}
        style={[styles.calculateButton, { backgroundColor: theme.colors.primary }]}
        contentStyle={styles.calculateButtonContent}
        labelStyle={[styles.calculateButtonLabel, { color: theme.colors.surface }]}
        loading={isCalculating}
        disabled={isCalculating}
      >
        {isCalculating ? 'Calculating...' : 'Calculate Nutrition'}
      </Button>

      {calories && protein && carbs && fat && (
        <View style={styles.macrosContainer}>
          <Text variant="titleMedium" style={[styles.macrosTitle, { color: theme.colors.text }]}>Calculated Nutrition</Text>
          <View style={styles.macrosGrid}>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Calories</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{calories}</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Protein</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{protein}g</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Carbs</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{carbs}g</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Fat</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{fat}g</Text>
            </View>
          </View>
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleAddMeal}
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        contentStyle={styles.addButtonContent}
        labelStyle={[styles.addButtonLabel, { color: theme.colors.surface }]}
      >
        Add Meal
      </Button>
    </Surface>
  );

  const renderImageAI = () => (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.text }]}>
        AI Food Recognition
      </Text>
      <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Upload a food photo or take a picture and our AI will identify what you're eating.
      </Text>

      <View style={styles.uploadButtons}>
        <Pressable 
          style={[styles.uploadButton, styles.galleryButton, { 
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.border
          }]}
          onPress={handleImageUpload}
        >
          <MaterialCommunityIcons name="image" size={32} color={theme.colors.textSecondary} />
          <Text style={[styles.uploadButtonText, { color: theme.colors.text }]}>
            Choose from Gallery
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.uploadButton, styles.cameraButton, { 
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.border
          }]}
          onPress={handleCameraCapture}
        >
          <MaterialCommunityIcons name="camera" size={32} color={theme.colors.textSecondary} />
          <Text style={[styles.uploadButtonText, { color: theme.colors.text }]}>
            Take Photo
          </Text>
        </Pressable>
      </View>

      {image && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <Pressable 
            style={styles.removeImage}
            onPress={() => setImage(null)}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      )}

      <Text variant="bodyLarge" style={[styles.footerText, { color: theme.colors.textSecondary }]}>
        Our AI analyzes your food photos to identify meals and estimate nutrition information.
      </Text>
    </Surface>
  );

  const renderNaturalLang = () => (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.text }]}>
        Natural Language Meal Entry
      </Text>
      <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Simply describe your meal in natural language and let our AI figure out the details.
      </Text>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      )}

      <TextInput
        mode="outlined"
        placeholder="E.g. I had a large chicken burrito with rice, beans, and guacamole for lunch"
        value={mealDescription}
        onChangeText={setMealDescription}
        multiline
        numberOfLines={4}
        style={[styles.textArea, { backgroundColor: theme.colors.surfaceVariant }]}
        outlineStyle={styles.textAreaOutline}
        textColor={theme.colors.text}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <Button
        mode="contained"
        onPress={handleProcessDescription}
        style={[styles.processButton, { backgroundColor: theme.colors.primary }]}
        contentStyle={styles.processButtonContent}
        labelStyle={[styles.processButtonLabel, { color: theme.colors.surface }]}
        loading={isCalculating}
        disabled={isCalculating}
      >
        {isCalculating ? 'Processing...' : 'Process Description'}
      </Button>

      {calories && protein && carbs && fat && (
        <View style={styles.macrosContainer}>
          <Text variant="titleMedium" style={[styles.macrosTitle, { color: theme.colors.text }]}>Detected Meal Information</Text>
          <View style={[styles.detectedInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.detectedInfoText, { color: theme.colors.text }]}>Name: {mealName}</Text>
            <Text style={[styles.detectedInfoText, { color: theme.colors.text }]}>Cuisine: {selectedCuisine}</Text>
            <Text style={[styles.detectedInfoText, { color: theme.colors.text }]}>Portion: {portionSize}</Text>
          </View>
          <Text variant="titleMedium" style={[styles.macrosTitle, { color: theme.colors.text }]}>Calculated Nutrition</Text>
          <View style={styles.macrosGrid}>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Calories</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{calories}</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Protein</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{protein}g</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Carbs</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{carbs}g</Text>
            </View>
            <View style={[styles.macroItem, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>Fat</Text>
              <Text style={[styles.macroValue, { color: theme.colors.primary }]}>{fat}g</Text>
            </View>
          </View>
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleAddMeal}
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        contentStyle={styles.addButtonContent}
        labelStyle={[styles.addButtonLabel, { color: theme.colors.surface }]}
        disabled={!calories || !protein || !carbs || !fat}
      >
        Add Meal
      </Button>
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calories Overview */}
        <Surface style={[styles.caloriesCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.calorieDetailHeader}>
            <Text variant="titleLarge" style={[styles.calorieTitle, { color: theme.colors.text }]}>Calories</Text>
            <Text variant="titleLarge" style={[styles.percentageText, { color: theme.colors.primary }]}>{caloriePercentage}%</Text>
          </View>
          
          <ProgressBar 
            progress={calorieProgress}
            color={theme.colors.primary}
            style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
          />
          
          <Surface style={[styles.metricsContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
            <View style={styles.calorieDetailsGrid}>
              <CalorieDetailItem label="Goal" value={calorieGoal} theme={theme} />
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <CalorieDetailItem label="Consumed" value={totalCalories} theme={theme} />
              <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <CalorieDetailItem label="Remaining" value={remainingCalories} theme={theme} />
            </View>
          </Surface>
        </Surface>

        <View style={styles.inputMethodContainer}>
          <SegmentedButtons
            value={inputMethod}
            onValueChange={setInputMethod}
            buttons={[
              { value: 'manual', label: 'Manual' },
              { value: 'imageai', label: 'Image AI' },
              { value: 'naturallang', label: 'Natural Lang' },
            ]}
            style={[styles.segmentedButtons, { backgroundColor: theme.colors.surface }]}
          />
        </View>

        {inputMethod === 'manual' ? renderManualInput() : 
         inputMethod === 'imageai' ? renderImageAI() : 
         renderNaturalLang()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Component
function CalorieDetailItem({ label, value, theme }: { label: string; value: number; theme: any }) {
  return (
    <View style={styles.calorieDetailItem}>
      <Text style={[styles.calorieDetailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.calorieDetailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  inputMethodContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  segmentedButtons: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card: {
    margin: 16,
    marginTop: 0,
    padding: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    marginBottom: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  inputOutline: {
    borderRadius: 12,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    gap: 8,
  },
  cuisineButton: {
    flex: 1,
    minWidth: '45%',
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  selectedCuisine: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cuisineButtonText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  selectedCuisineText: {
    color: 'white',
    fontWeight: '600',
  },
  portionSelect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  portionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  menuContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  menuItemSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  calculateButton: {
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  calculateButtonContent: {
    height: 52,
  },
  calculateButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  macrosContainer: {
    marginVertical: 24,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  macrosTitle: {
    marginBottom: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonContent: {
    height: 52,
  },
  addButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Image AI styles
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  uploadButton: {
    flex: 1,
    height: 160,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  imagePreview: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  previewImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  removeImage: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  textArea: {
    backgroundColor: 'white',
    marginBottom: 24,
    minHeight: 120,
  },
  textAreaOutline: {
    borderRadius: 12,
  },
  processButton: {
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
  },
  processButtonContent: {
    height: 48,
  },
  processButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  caloriesCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  calorieDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 20,
  },
  metricsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  calorieDetailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  calorieDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  calorieDetailLabel: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  calorieDetailValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: '80%',
    opacity: 0.2,
  },
  transliteratedText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FF5252',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  detectedInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  detectedInfoText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
    fontWeight: '500',
  },
}); 