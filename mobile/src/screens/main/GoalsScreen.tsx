import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GoalsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0F766E', '#14B8A6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <Text style={styles.headerSubtitle}>
          Track your progress toward financial freedom
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.comingSoon}>
          <Icon name="flag" size={64} color="#6B7280" />
          <Text style={styles.comingSoonTitle}>Goals Feature</Text>
          <Text style={styles.comingSoonDescription}>
            Goal setting and progress tracking features are coming soon to the mobile app.
          </Text>
          <TouchableOpacity style={styles.notifyButton}>
            <Text style={styles.notifyButtonText}>Get Notified</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F0FDFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  notifyButton: {
    backgroundColor: '#14B8A6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  notifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalsScreen;