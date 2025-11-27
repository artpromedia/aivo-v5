import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface SkillBuilderProps {
  onSkillPress: (skillId: string) => void;
}

const SkillBuilder: React.FC<SkillBuilderProps> = ({onSkillPress}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>SkillBuilder Component</Text>
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

export default SkillBuilder;
