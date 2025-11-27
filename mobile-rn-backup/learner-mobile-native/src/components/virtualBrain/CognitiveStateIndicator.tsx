import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface CognitiveStateIndicatorProps {
  state?: {
    attention_level: number;
    engagement_score: number;
    difficulty_preference: string;
    learning_pace: string;
  };
  performance?: {
    accuracy: number;
    speed: number;
    consistency: number;
  };
}

const CognitiveStateIndicator: React.FC<CognitiveStateIndicatorProps> = ({
  state,
  performance,
}) => {
  if (!state) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading state...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Attention:</Text>
        <View style={styles.bar}>
          <View
            style={[styles.fill, {width: `${state.attention_level * 100}%`}]}
          />
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Engagement:</Text>
        <View style={styles.bar}>
          <View
            style={[styles.fill, {width: `${state.engagement_score * 100}%`}]}
          />
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Pace:</Text>
        <Text style={styles.value}>{state.learning_pace}</Text>
      </View>

      {performance && (
        <View style={styles.row}>
          <Text style={styles.label}>Accuracy:</Text>
          <Text style={styles.value}>{(performance.accuracy * 100).toFixed(0)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  bar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  text: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default CognitiveStateIndicator;
