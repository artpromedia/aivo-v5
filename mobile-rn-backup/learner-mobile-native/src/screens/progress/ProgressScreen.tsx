import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions} from 'react-native';
import {LineChart, BarChart, ContributionGraph} from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';

const {width} = Dimensions.get('window');

const ProgressScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    propsForBackgroundLines: {strokeDasharray: '', stroke: '#E5E7EB'},
  };

  const getChartData = () => {
    const labels = timeRange === 'week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : timeRange === 'month'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      labels,
      datasets: [{data: [65, 72, 68, 85, 78, 82, 90]}],
    };
  };

  const getActivityHeatmap = () => {
    const data = [];
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5),
      });
    }
    return data;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning Progress</Text>
        <TouchableOpacity style={styles.reportButton}>
          <Icon name="file-download" size={20} color="#FFFFFF" />
          <Text style={styles.reportButtonText}>Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeRangeContainer}>
        {(['week', 'month', 'year'] as const).map(range => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(range)}>
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive,
              ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="clock-outline" size={24} color="#8B5CF6" />
          <Text style={styles.statValue}>120</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="target" size={24} color="#10B981" />
          <Text style={styles.statValue}>85%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="fire" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Accuracy Trend</Text>
        <LineChart
          data={getChartData()}
          width={width - 40}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Skill Mastery</Text>
        <BarChart
          data={{
            labels: ['Math', 'Read', 'Write', 'Sci'],
            datasets: [{data: [80, 75, 65, 88]}],
          }}
          width={width - 40}
          height={200}
          yAxisLabel=""
          yAxisSuffix="%"
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Activity Heatmap</Text>
        <ContributionGraph
          values={getActivityHeatmap()}
          endDate={new Date()}
          numDays={90}
          width={width - 40}
          height={150}
          chartConfig={chartConfig}
          style={styles.chart}
          tooltipDataAttrs={(value: any) => ({})}
        />
      </View>

      <View style={styles.subjectProgressContainer}>
        <Text style={styles.chartTitle}>Subject Progress</Text>
        <Picker
          selectedValue={selectedSubject}
          onValueChange={setSelectedSubject}
          style={styles.subjectPicker}>
          <Picker.Item label="All Subjects" value="all" />
          <Picker.Item label="Mathematics" value="math" />
          <Picker.Item label="Reading" value="reading" />
          <Picker.Item label="Science" value="science" />
        </Picker>
      </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  timeRangeText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
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
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  subjectProgressContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectPicker: {
    marginTop: 8,
  },
});

export default ProgressScreen;
