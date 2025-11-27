import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface SubjectGridProps {
  onSubjectPress: (subjectId: string) => void;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({onSubjectPress}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>SubjectGrid Component</Text>
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

export default SubjectGrid;
