import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface DiagnosisSelectorProps {
  selectedDiagnoses: string[];
  onSelect: (diagnosis: string) => void;
}

const DiagnosisSelector: React.FC<DiagnosisSelectorProps> = ({selectedDiagnoses, onSelect}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>DiagnosisSelector Component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  placeholder: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default DiagnosisSelector;
