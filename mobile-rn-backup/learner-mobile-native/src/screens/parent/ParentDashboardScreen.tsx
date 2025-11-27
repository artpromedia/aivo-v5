import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import aivoApi from '../../services/api/aivoApi';

const Tab = createMaterialTopTabNavigator();

interface ParentDashboardScreenProps {
  navigation: any;
}

const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({navigation}) => {
  const [learners, setLearners] = useState<any[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data for now
      const mockLearners = [
        {id: '1', first_name: 'Emma', last_name: 'Smith', avatar: null},
        {id: '2', first_name: 'Noah', last_name: 'Smith', avatar: null},
      ];
      
      const mockDashboard = {
        todayMinutes: 45,
        streak: 7,
        achievements: 12,
      };
      
      setLearners(mockLearners);
      setDashboardData(mockDashboard);
      
      if (mockLearners.length > 0 && !selectedLearner) {
        setSelectedLearner(mockLearners[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const addNewLearner = () => {
    Alert.alert('Add Learner', 'Add learner feature coming soon');
  };

  const OverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.learnerScroll}>
        {learners.map(learner => (
          <TouchableOpacity
            key={learner.id}
            style={[
              styles.learnerCard,
              selectedLearner?.id === learner.id && styles.learnerCardSelected,
            ]}
            onPress={() => setSelectedLearner(learner)}>
            <View style={styles.learnerAvatar}>
              <Text style={styles.learnerInitials}>
                {learner.first_name[0]}{learner.last_name[0]}
              </Text>
            </View>
            <Text style={styles.learnerName}>{learner.first_name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addLearnerCard} onPress={addNewLearner}>
          <Icon name="plus" size={32} color="#8B5CF6" />
          <Text style={styles.addLearnerText}>Add Child</Text>
        </TouchableOpacity>
      </ScrollView>

      {selectedLearner && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="clock" size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{dashboardData?.todayMinutes || 0}</Text>
              <Text style={styles.statLabel}>Minutes Today</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="fire" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{dashboardData?.streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="trophy" size={24} color="#10B981" />
              <Text style={styles.statValue}>{dashboardData?.achievements || 0}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.placeholderText}>Activity timeline coming soon</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            <Text style={styles.placeholderText}>Personalized recommendations coming soon</Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  const ActivityTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.placeholderText}>Activity timeline feature coming soon</Text>
    </ScrollView>
  );

  const ScheduleTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.placeholderText}>Schedule manager feature coming soon</Text>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parent Dashboard</Text>
        <TouchableOpacity onPress={() => Alert.alert('Settings', 'Settings coming soon')}>
          <Icon name="cog" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {fontSize: 14, fontWeight: '500'},
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#6B7280',
          tabBarIndicatorStyle: {backgroundColor: '#8B5CF6'},
        }}>
        <Tab.Screen name="Overview" component={OverviewTab} />
        <Tab.Screen name="Activity" component={ActivityTab} />
        <Tab.Screen name="Schedule" component={ScheduleTab} />
      </Tab.Navigator>
    </View>
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
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tabContent: {
    flex: 1,
  },
  learnerScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  learnerCard: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  learnerCardSelected: {
    borderColor: '#8B5CF6',
  },
  learnerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnerInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  learnerName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  addLearnerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    width: 100,
  },
  addLearnerText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default ParentDashboardScreen;
