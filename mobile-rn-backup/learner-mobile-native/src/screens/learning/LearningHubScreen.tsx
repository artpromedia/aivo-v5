import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const LearningHubScreen: React.FC = () => {
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [routes] = useState([
    {key: 'subjects', title: 'Subjects'},
    {key: 'adaptive', title: 'For You'},
    {key: 'skills', title: 'Skills'},
    {key: 'practice', title: 'Practice'},
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const SubjectsRoute = () => (
    <ScrollView style={styles.scene} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <TouchableOpacity style={styles.card} onPress={() => (navigation as any).navigate('VirtualBrain')}>
        <Icon name="calculator" size={40} color="#3B82F6" />
        <Text style={styles.cardTitle}>Mathematics</Text>
        <Text style={styles.cardText}>Adaptive math learning</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card}>
        <Icon name="book-open-variant" size={40} color="#10B981" />
        <Text style={styles.cardTitle}>Reading</Text>
        <Text style={styles.cardText}>Improve comprehension</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const AdaptiveRoute = () => (
    <ScrollView style={styles.scene} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Recommended for you</Text>
        <Text style={styles.cardText}>Personalized learning path</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const SkillsRoute = () => (
    <ScrollView style={styles.scene} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Problem Solving</Text>
        <Text style={styles.cardText}>Level 5 • 80% mastery</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const PracticeRoute = () => (
    <ScrollView style={styles.scene} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Daily Practice</Text>
        <Text style={styles.cardText}>Keep your skills sharp</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderScene = SceneMap({
    subjects: SubjectsRoute,
    adaptive: AdaptiveRoute,
    skills: SkillsRoute,
    practice: PracticeRoute,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={styles.tabBar}
      indicatorStyle={styles.tabIndicator}
      labelStyle={styles.tabLabel}
      activeColor="#8B5CF6"
      inactiveColor="#6B7280"
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning Hub</Text>
        <TouchableOpacity
          style={styles.brainButton}
          onPress={() => (navigation as any).navigate('VirtualBrain')}>
          <Icon name="brain" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <Icon name="clipboard-check" size={24} color="#10B981" />
          <Text style={styles.actionText}>Assessment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => (navigation as any).navigate('Progress')}>
          <Icon name="chart-line" size={24} color="#3B82F6" />
          <Text style={styles.actionText}>Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Icon name="trophy" size={24} color="#F59E0B" />
          <Text style={styles.actionText}>Achievements</Text>
        </TouchableOpacity>
      </ScrollView>

      <TabView
        navigationState={{index, routes}}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{width}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: {fontSize: 24, fontWeight: '600', color: '#1F2937'},
  brainButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {paddingHorizontal: 20, marginBottom: 20},
  actionCard: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  actionText: {marginTop: 8, fontSize: 12, color: '#6B7280', fontWeight: '500'},
  scene: {flex: 1, padding: 20},
  tabBar: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabIndicator: {backgroundColor: '#8B5CF6', height: 3},
  tabLabel: {fontSize: 14, fontWeight: '500'},
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
    marginTop: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
});

export default LearningHubScreen;
