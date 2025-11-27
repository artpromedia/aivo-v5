import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface AssessmentQuestionProps {
  question: any;
  onAnswer: (answer: any) => void;
}

const AssessmentQuestion: React.FC<AssessmentQuestionProps> = ({question, onAnswer}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>AssessmentQuestion Component</Text>
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

export default AssessmentQuestion;
