import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface AdaptiveLessonsProps {
  onLessonPress: (lessonId: string) => void;
}

const AdaptiveLessons: React.FC<AdaptiveLessonsProps> = ({onLessonPress}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>AdaptiveLessons Component</Text>
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

export default AdaptiveLessons;
