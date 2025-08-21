import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleSubscribe = () => {
    navigation.navigate('Subscribe' as never);
  };

  const ProfileOption = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    iconColor = '#6B7280',
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    iconColor?: string;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.optionCard}>
        <View style={styles.optionContent}>
          <View style={styles.optionLeft}>
            <Icon name={icon} size={24} color={iconColor} />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{title}</Text>
              {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
            </View>
          </View>
          {showArrow && (
            <Icon name="chevron-right" size={24} color="#6B7280" />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0F766E', '#14B8A6']}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Icon name="person" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>{user?.username || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          
          {user?.isPremium ? (
            <View style={styles.premiumBadge}>
              <Icon name="star" size={16} color="#F59E0B" />
              <Text style={styles.premiumText}>Premium Member</Text>
            </View>
          ) : user?.isOnFreeTrial ? (
            <View style={styles.trialBadge}>
              <Icon name="schedule" size={16} color="#14B8A6" />
              <Text style={styles.trialText}>
                Free Trial • {user?.trialDaysLeft || 0} days left
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleSubscribe}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              <Icon name="arrow-forward" size={16} color="#14B8A6" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <ProfileOption
            icon="person"
            title="Personal Information"
            subtitle="Update your profile details"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
          />
          
          <ProfileOption
            icon="security"
            title="Security & Privacy"
            subtitle="Password, 2FA, and privacy settings"
            onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon')}
          />
          
          <ProfileOption
            icon="notifications"
            title="Notifications"
            subtitle="Customize your notification preferences"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          {user?.isPremium ? (
            <ProfileOption
              icon="star"
              title="Manage Subscription"
              subtitle="View billing and cancel subscription"
              iconColor="#F59E0B"
              onPress={() => Alert.alert('Coming Soon', 'Subscription management will be available soon')}
            />
          ) : (
            <ProfileOption
              icon="upgrade"
              title="Upgrade to Premium"
              subtitle="Get access to all features"
              iconColor="#14B8A6"
              onPress={handleSubscribe}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <ProfileOption
            icon="help"
            title="Help & Support"
            subtitle="Get help with using the app"
            onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon')}
          />
          
          <ProfileOption
            icon="feedback"
            title="Send Feedback"
            subtitle="Help us improve the app"
            onPress={() => Alert.alert('Coming Soon', 'Feedback form will be available soon')}
          />
          
          <ProfileOption
            icon="info"
            title="About"
            subtitle="App version and legal information"
            onPress={() => Alert.alert('Mind My Money', 'Version 2.0.0\n\nYour AI-powered financial management companion.')}
          />
        </View>

        <View style={styles.section}>
          <ProfileOption
            icon="logout"
            title="Sign Out"
            onPress={handleLogout}
            iconColor="#EF4444"
            showArrow={false}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Mind My Money v2.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️ for your financial success</Text>
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
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#F0FDFA',
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  premiumText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trialText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#14B8A6',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    marginLeft: 4,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default ProfileScreen;