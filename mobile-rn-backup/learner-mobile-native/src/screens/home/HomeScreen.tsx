import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../contexts/AuthContext';

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {user} = useAuth();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, {paddingTop: insets.top + 20}]}>
      <Text style={styles.greeting}>Hello, {user?.full_name || 'Learner'}!</Text>
      <Text style={styles.subtitle}>Ready to learn today?</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Continue Learning</Text>
        <Text style={styles.cardText}>
          Pick up where you left off with your Virtual Brain
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Goals</Text>
        <Text style={styles.cardText}>Complete 3 learning activities</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default HomeScreen;
