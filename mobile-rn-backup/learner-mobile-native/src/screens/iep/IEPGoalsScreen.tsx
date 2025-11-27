import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ProgressBar} from 'react-native-paper';

import aivoApi from '../../services/api/aivoApi';

interface IEPGoalsScreenProps {
  route: any;
  navigation: any;
}

const IEPGoalsScreen: React.FC<IEPGoalsScreenProps> = ({route, navigation}) => {
  const {learnerId} = route.params;
  const [goals, setGoals] = useState<any[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'academic',
    criteria: '',
    baseline: '',
    measurable: true,
  });

  useEffect(() => {
    loadIEPGoals();
  }, []);

  const loadIEPGoals = async () => {
    try {
      // Mock data for now
      setGoals([
        {
          id: '1',
          title: 'Improve Reading Comprehension',
          category: 'Academic',
          criteria: 'Answer 80% of comprehension questions correctly',
          progress: 0.65,
        },
        {
          id: '2',
          title: 'Enhance Math Problem Solving',
          category: 'Academic',
          criteria: 'Solve 3-step word problems independently',
          progress: 0.45,
        },
      ]);
    } catch (error) {
      console.error('Failed to load IEP goals:', error);
    }
  };

  const addGoal = async () => {
    try {
      if (!newGoal.title || !newGoal.criteria) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // TODO: API call when backend is ready
      Alert.alert('Success', 'Goal added successfully');
      setShowAddGoal(false);
      loadIEPGoals();
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>IEP Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddGoal(true)}>
          <Icon name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Goal</Text>
        </TouchableOpacity>
      </View>

      {showAddGoal && (
        <View style={styles.addGoalForm}>
          <TextInput
            style={styles.input}
            placeholder="Goal Title *"
            value={newGoal.title}
            onChangeText={(text) => setNewGoal({...newGoal, title: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Success Criteria *"
            value={newGoal.criteria}
            onChangeText={(text) => setNewGoal({...newGoal, criteria: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Current Baseline"
            value={newGoal.baseline}
            onChangeText={(text) => setNewGoal({...newGoal, baseline: text})}
          />
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Measurable Goal</Text>
            <Switch
              value={newGoal.measurable}
              onValueChange={(value) => setNewGoal({...newGoal, measurable: value})}
              trackColor={{false: '#D1D5DB', true: '#C4B5FD'}}
              thumbColor={newGoal.measurable ? '#8B5CF6' : '#F3F4F6'}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddGoal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={addGoal}>
              <Text style={styles.saveButtonText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {goals.map(goal => (
        <View key={goal.id} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{goal.category}</Text>
            </View>
          </View>
          
          <Text style={styles.goalCriteria}>{goal.criteria}</Text>
          
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              Progress: {Math.round(goal.progress * 100)}%
            </Text>
            <ProgressBar
              progress={goal.progress}
              color="#8B5CF6"
              style={styles.progressBar}
            />
          </View>
          
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => Alert.alert('Update', 'Progress update coming soon')}>
              <Icon name="pencil" size={20} color="#8B5CF6" />
              <Text style={styles.updateButtonText}>Update Progress</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => Alert.alert('Details', 'Goal details coming soon')}>
              <Icon name="chart-line" size={20} color="#10B981" />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addGoalForm: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 12,
  },
  categoryBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  goalCriteria: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    gap: 6,
  },
  updateButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
});

export default IEPGoalsScreen;
