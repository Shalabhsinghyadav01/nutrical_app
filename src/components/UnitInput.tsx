import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

interface UnitInputProps {
  value: number;
  onValueChange: (value: number) => void;
  type: 'weight' | 'height';
  style?: any;
}

const UnitInput: React.FC<UnitInputProps> = ({
  value,
  onValueChange,
  type,
  style,
}) => {
  const [isMetric, setIsMetric] = useState(true);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    updateDisplayValue(value);
  }, [value, isMetric]);

  const updateDisplayValue = (val: number) => {
    if (type === 'weight') {
      setDisplayValue(
        isMetric
          ? val.toString()
          : (val * 2.20462).toFixed(1) // kg to lbs
      );
    } else {
      setDisplayValue(
        isMetric
          ? val.toString()
          : Math.floor(val / 2.54).toString() // cm to inches
      );
    }
  };

  const handleValueChange = (text: string) => {
    const numValue = parseFloat(text) || 0;
    let convertedValue: number;

    if (type === 'weight') {
      convertedValue = isMetric ? numValue : numValue / 2.20462; // lbs to kg
    } else {
      convertedValue = isMetric ? numValue : numValue * 2.54; // inches to cm
    }

    onValueChange(Math.round(convertedValue * 10) / 10);
  };

  const toggleUnit = () => {
    setIsMetric(!isMetric);
  };

  const getUnitLabel = () => {
    if (type === 'weight') {
      return isMetric ? 'kg' : 'lbs';
    }
    return isMetric ? 'cm' : 'in';
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={displayValue}
        onChangeText={handleValueChange}
        keyboardType="numeric"
        placeholder={`Enter ${type}`}
      />
      <TouchableOpacity onPress={toggleUnit} style={styles.unitButton}>
        <Text style={styles.unitText}>{getUnitLabel()}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    ...Platform.select({
      ios: {
        paddingVertical: 12,
      },
      android: {
        paddingVertical: 8,
      },
    }),
  },
  unitButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});

export default UnitInput; 