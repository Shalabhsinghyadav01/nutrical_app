import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, ProgressBar, Button, Portal, Modal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Supplement {
  name: string;
  waterImpact: 'high' | 'medium' | 'low';
  isSelected: boolean;
  waterAmount: number;
  isAutoDetected?: boolean;
}

export default function WaterIntake() {
  const { theme } = useTheme();
  const [currentIntake, setCurrentIntake] = useState(0);
  const [activeTab, setActiveTab] = useState('quickAdd');
  const [customAmount, setCustomAmount] = useState(250);
  const [supplementModalVisible, setSupplementModalVisible] = useState(false);
  const [supplementName, setSupplementName] = useState('');
  const [supplementAmount, setSupplementAmount] = useState('');
  const [supplements, setSupplements] = useState<Supplement[]>([
    { name: 'Creatine', waterImpact: 'high', isSelected: false, waterAmount: 500 },
    { name: 'Protein Powder', waterImpact: 'medium', isSelected: false, waterAmount: 300 },
    { name: 'Pre-Workout', waterImpact: 'high', isSelected: false, waterAmount: 400 },
    { name: 'BCAAs', waterImpact: 'medium', isSelected: false, waterAmount: 250 },
    { name: 'Caffeine', waterImpact: 'high', isSelected: false, waterAmount: 350 },
    { name: 'Multivitamin', waterImpact: 'low', isSelected: false, waterAmount: 100 },
    { name: 'Fish Oil', waterImpact: 'low', isSelected: false, waterAmount: 100 },
  ]);
  const [baseGoalIntake, setBaseGoalIntake] = useState(3.1); // Base goal in liters
  const [adjustedGoalIntake, setAdjustedGoalIntake] = useState(3.1); // Adjusted goal based on supplements

  // Effect to update goal when supplements change
  useEffect(() => {
    updateWaterGoal();
  }, [supplements]);

  const updateWaterGoal = () => {
    const additionalWater = supplements
      .filter(s => s.isSelected)
      .reduce((sum, s) => sum + s.waterAmount, 0) / 1000; // Convert to liters
    const newGoal = baseGoalIntake + additionalWater;
    setAdjustedGoalIntake(newGoal);
  };

  const addWater = (amount: number) => {
    setCurrentIntake(Math.min(currentIntake + amount, adjustedGoalIntake));
  };

  const resetWater = () => {
    setCurrentIntake(0);
    setSupplements(supplements.map(s => ({ ...s, isSelected: false })));
    setAdjustedGoalIntake(baseGoalIntake);
  };

  const toggleSupplement = (index: number) => {
    const newSupplements = [...supplements];
    newSupplements[index].isSelected = !newSupplements[index].isSelected;
    setSupplements(newSupplements);
  };

  // AI function to detect supplements from meal
  const detectSupplementsFromMeal = (mealDescription: string) => {
    const detectedSupplements = supplements.map(supplement => {
      const isDetected = mealDescription.toLowerCase().includes(supplement.name.toLowerCase());
      return {
        ...supplement,
        isSelected: isDetected ? true : supplement.isSelected,
        isAutoDetected: isDetected
      };
    });
    setSupplements(detectedSupplements);
  };

  // Example usage: Call this when a meal is added
  // detectSupplementsFromMeal("Post-workout protein shake with creatine");

  const addSupplement = () => {
    if (supplementName && supplementAmount) {
      const suggestion = getSupplementWaterSuggestion(supplementName);
      const newSupplement: Supplement = {
        name: supplementName,
        waterImpact: 'medium',
        isSelected: true,
        waterAmount: suggestion.ml,
        isAutoDetected: false
      };

      setSupplements([...supplements, newSupplement]);
      setSupplementName('');
      setSupplementAmount('');
      setSupplementModalVisible(false);

      // Update total water suggestion
      const newTotal = adjustedGoalIntake + suggestion.ml / 1000;
      setAdjustedGoalIntake(newTotal);
      
      // Show AI suggestion
      alert(`AI Suggestion: ${suggestion.reason}. We've adjusted your daily water goal to ${(newTotal).toFixed(1)}L.`);
    }
  };

  const getSupplementWaterSuggestion = (name: string): { ml: number; reason: string } => {
    const nameLower = name.toLowerCase();
    const suggestions = {
      creatine: { ml: 500, reason: 'Additional water helps prevent cramping and supports creatine absorption' },
      protein: { ml: 300, reason: 'Extra water aids protein absorption and prevents dehydration' },
      preworkout: { ml: 400, reason: 'Caffeine in pre-workout can be dehydrating' },
      bcaa: { ml: 250, reason: 'Supports amino acid absorption and muscle recovery' },
      caffeine: { ml: 350, reason: 'Compensates for the diuretic effect of caffeine' },
      electrolytes: { ml: -200, reason: 'Electrolytes help retain water, slightly reducing needed intake' },
      'vitamin c': { ml: 100, reason: 'Supports vitamin absorption and hydration' },
      'fish oil': { ml: 100, reason: 'Helps with supplement absorption' },
      default: { ml: 100, reason: 'General hydration support for supplement absorption' }
    };

    for (const [key, value] of Object.entries(suggestions)) {
      if (nameLower.includes(key)) {
        return value;
      }
    }
    return suggestions.default;
  };

  const renderCustomSection = () => {
    const amounts = [100, 250, 500, 750, 1000];
    
    return (
      <View style={styles.customSection}>
        <Text style={styles.customTitle}>Select Amount:</Text>
        <View style={styles.customAmounts}>
          {amounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.amountButton,
                customAmount === amount && styles.selectedAmount
              ]}
              onPress={() => setCustomAmount(amount)}
            >
              <Text style={[
                styles.amountText,
                customAmount === amount && styles.selectedAmountText
              ]}>{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Pressable 
          style={styles.addCustomButton}
          onPress={() => addWater(customAmount / 1000)}
        >
          <Text style={styles.addCustomButtonText}>Add {customAmount}ml</Text>
        </Pressable>
      </View>
    );
  };

  const renderSupplementsList = () => (
    <View style={styles.supplementsList}>
      <Text style={styles.supplementsDescription}>
        Select supplements you're taking to adjust water recommendations.
      </Text>
      
      {supplements.map((supplement, index) => (
        <Pressable
          key={index}
          style={styles.supplementItem}
          onPress={() => toggleSupplement(index)}
        >
          <View style={styles.supplementLeft}>
            <View style={[
              styles.checkbox,
              supplement.isSelected && styles.checkboxSelected
            ]}>
              {supplement.isSelected && (
                <MaterialCommunityIcons name="check" size={16} color="white" />
              )}
            </View>
            <View>
              <Text style={styles.supplementName}>{supplement.name}</Text>
              {supplement.isSelected && (
                <Text style={styles.waterAmount}>+{supplement.waterAmount}ml water</Text>
              )}
            </View>
          </View>
          <View style={[
            styles.impactBadge,
            styles[`${supplement.waterImpact}Impact`]
          ]}>
            <Text style={[
              styles.impactText,
              supplement.waterImpact === 'low' && styles.lowImpactText
            ]}>{supplement.waterImpact}</Text>
          </View>
        </Pressable>
      ))}

      <View style={styles.supplementNote}>
        <Text style={styles.noteText}>
          <Text style={styles.greenText}>Green supplements</Text> were automatically detected in your meals.
        </Text>
      </View>

      {supplements.some(s => s.isSelected) && (
        <View style={styles.aiInsightBox}>
          <MaterialCommunityIcons name="brain" size={20} color="#2196F3" />
          <Text style={styles.aiInsightText}>
            Based on your supplement intake, we've adjusted your water goal to {adjustedGoalIntake.toFixed(1)}L today.
            This helps optimize supplement absorption and maintains proper hydration.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="water" size={24} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>Water Intake</Text>
        </View>
        <MaterialCommunityIcons name="information" size={24} color={theme.colors.textSecondary} />
      </View>

      <View style={styles.progress}>
        <Text style={[styles.currentIntake, { color: theme.colors.text }]}>{currentIntake.toFixed(1)}L</Text>
        <Text style={[styles.goalIntake, { color: theme.colors.text }]}>{adjustedGoalIntake.toFixed(1)}L</Text>
      </View>

      <ProgressBar 
        progress={currentIntake / adjustedGoalIntake} 
        color={theme.colors.primary}
        style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
      />

      <View style={styles.labels}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Current</Text>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Adjusted Goal</Text>
      </View>

      <View style={[styles.segmentedButtons, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Pressable 
          style={[
            styles.button, 
            activeTab === 'quickAdd' && [styles.activeButton, { backgroundColor: theme.colors.surface }]
          ]}
          onPress={() => setActiveTab('quickAdd')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>Quick Add</Text>
        </Pressable>
        <Pressable 
          style={[
            styles.button, 
            activeTab === 'custom' && [styles.activeButton, { backgroundColor: theme.colors.surface }]
          ]}
          onPress={() => setActiveTab('custom')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>Custom</Text>
        </Pressable>
        <Pressable 
          style={[
            styles.button, 
            activeTab === 'supplements' && [styles.activeButton, { backgroundColor: theme.colors.surface }]
          ]}
          onPress={() => setActiveTab('supplements')}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>Supplements</Text>
        </Pressable>
      </View>

      {activeTab === 'quickAdd' && (
        <View style={styles.quickAddButtons}>
          <Pressable 
            style={[styles.addButton, { 
              borderColor: theme.colors.surfaceVariant,
              backgroundColor: theme.colors.surface 
            }]}
            onPress={() => addWater(0.1)}
          >
            <Text style={[styles.addButtonText, { color: theme.colors.text }]}>+ 100ml</Text>
          </Pressable>
          <Pressable 
            style={[styles.addButton, { 
              borderColor: theme.colors.surfaceVariant,
              backgroundColor: theme.colors.surface 
            }]}
            onPress={() => addWater(0.25)}
          >
            <Text style={[styles.addButtonText, { color: theme.colors.text }]}>+ 250ml</Text>
          </Pressable>
          <Pressable 
            style={[styles.addButton, { 
              borderColor: theme.colors.surfaceVariant,
              backgroundColor: theme.colors.surface 
            }]}
            onPress={() => addWater(0.5)}
          >
            <Text style={[styles.addButtonText, { color: theme.colors.text }]}>+ 500ml</Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'custom' && (
        <View style={styles.customSection}>
          <Text style={[styles.customTitle, { color: theme.colors.textSecondary }]}>Select Amount:</Text>
          <View style={styles.customAmounts}>
            {[100, 250, 500, 750, 1000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  { 
                    backgroundColor: customAmount === amount ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderColor: customAmount === amount ? theme.colors.primary : theme.colors.surfaceVariant
                  }
                ]}
                onPress={() => setCustomAmount(amount)}
              >
                <Text style={[
                  styles.amountText,
                  { color: customAmount === amount ? theme.colors.surface : theme.colors.text }
                ]}>{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Pressable 
            style={[styles.addCustomButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => addWater(customAmount / 1000)}
          >
            <Text style={[styles.addCustomButtonText, { color: theme.colors.surface }]}>Add {customAmount}ml</Text>
          </Pressable>
        </View>
      )}

      {activeTab === 'supplements' && (
        <View style={styles.supplementsList}>
          <Text style={[styles.supplementsDescription, { color: theme.colors.textSecondary }]}>
            Select supplements you're taking to adjust water recommendations.
          </Text>
          
          {supplements.map((supplement, index) => (
            <Pressable
              key={index}
              style={[styles.supplementItem, { borderBottomColor: theme.colors.surfaceVariant }]}
              onPress={() => toggleSupplement(index)}
            >
              <View style={styles.supplementLeft}>
                <View style={[
                  styles.checkbox,
                  { borderColor: theme.colors.primary },
                  supplement.isSelected && { backgroundColor: theme.colors.primary }
                ]}>
                  {supplement.isSelected && (
                    <MaterialCommunityIcons name="check" size={16} color={theme.colors.surface} />
                  )}
                </View>
                <View>
                  <Text style={[styles.supplementName, { color: theme.colors.text }]}>{supplement.name}</Text>
                  {supplement.isSelected && (
                    <Text style={[styles.waterAmount, { color: theme.colors.primary }]}>+{supplement.waterAmount}ml water</Text>
                  )}
                </View>
              </View>
              <View style={[
                styles.impactBadge,
                styles[`${supplement.waterImpact}Impact`],
                supplement.waterImpact === 'low' && { backgroundColor: theme.colors.surfaceVariant }
              ]}>
                <Text style={[
                  styles.impactText,
                  supplement.waterImpact === 'low' ? { color: theme.colors.text } : { color: theme.colors.surface }
                ]}>{supplement.waterImpact}</Text>
              </View>
            </Pressable>
          ))}

          <View style={styles.supplementNote}>
            <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
              <Text style={[styles.greenText, { color: theme.colors.primary }]}>Green supplements</Text> were automatically detected in your meals.
            </Text>
          </View>

          {supplements.some(s => s.isSelected) && (
            <View style={[styles.aiInsightBox, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
              <Text style={[styles.aiInsightText, { color: theme.colors.text }]}>
                Based on your supplement intake, we've adjusted your water goal to {adjustedGoalIntake.toFixed(1)}L today.
                This helps optimize supplement absorption and maintains proper hydration.
              </Text>
            </View>
          )}
        </View>
      )}

      <Pressable 
        style={[styles.resetButton, { backgroundColor: theme.colors.surfaceVariant }]}
        onPress={resetWater}
      >
        <Text style={[styles.resetButtonText, { color: theme.colors.text }]}>Reset</Text>
      </Pressable>

      <View style={styles.tipsContainer}>
        <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>Hydration Tips</Text>
        <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>• Set reminders on your phone to drink water every hour.</Text>
        <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>• Carry a water bottle with you at all times.</Text>
        <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>• Proper hydration is essential for optimal muscle protein synthesis and recovery.</Text>
        <Text style={[styles.tip, { color: theme.colors.textSecondary }]}>• Even mild dehydration can reduce strength and power output during workouts.</Text>
      </View>

      <Portal>
        <Modal
          visible={supplementModalVisible}
          onDismiss={() => setSupplementModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Supplement</Text>
          <TextInput
            mode="outlined"
            label="Supplement Name"
            value={supplementName}
            onChangeText={setSupplementName}
            style={[styles.modalInput, { backgroundColor: theme.colors.surface }]}
          />
          <TextInput
            mode="outlined"
            label="Amount (with unit)"
            value={supplementAmount}
            onChangeText={setSupplementAmount}
            style={[styles.modalInput, { backgroundColor: theme.colors.surface }]}
          />
          <Button mode="contained" onPress={addSupplement} style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}>
            Add
          </Button>
        </Modal>
      </Portal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentIntake: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  goalIntake: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666666',
  },
  segmentedButtons: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  addButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#1a1a1a',
  },
  resetButton: {
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 24,
  },
  resetButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#1a1a1a',
  },
  tipsContainer: {
    gap: 8,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tip: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  supplementsList: {
    marginTop: 16,
  },
  supplementsDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 24,
  },
  supplementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  supplementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
  },
  supplementName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  impactBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  highImpact: {
    backgroundColor: '#ef5350',
  },
  mediumImpact: {
    backgroundColor: '#66bb6a',
  },
  lowImpact: {
    backgroundColor: '#f5f5f5',
  },
  impactText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  supplementNote: {
    marginTop: 16,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  greenText: {
    color: '#4CAF50',
  },
  aiInsightBox: {
    marginTop: 16,
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  aiInsightText: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 14,
    lineHeight: 20,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  modalButton: {
    marginTop: 8,
    backgroundColor: '#2196F3',
  },
  customSection: {
    padding: 16,
  },
  customTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  customAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amountButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedAmount: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  amountText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedAmountText: {
    color: 'white',
  },
  addCustomButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addCustomButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  waterAmount: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  lowImpactText: {
    color: '#666666',
  },
}); 