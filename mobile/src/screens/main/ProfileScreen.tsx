import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  List,
  Divider,
  Switch,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
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
          onPress: logout 
        },
      ]
    );
  };

  const renderUserInfo = () => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <Avatar.Text 
            size={60} 
            label={user?.firstName ? 
              `${user.firstName[0]}${user.lastName?.[0] || ''}` : 
              user?.username[0].toUpperCase() || 'U'
            }
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.username
              }
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
        
        <Button 
          mode="outlined" 
          style={styles.editProfileButton}
          icon="edit"
        >
          Edit Profile
        </Button>
      </Card.Content>
    </Card>
  );

  const renderAccountSettings = () => (
    <Card style={styles.settingsCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <List.Item
          title="Personal Information"
          description="Update your profile details"
          left={props => <List.Icon {...props} icon="account-circle" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* Navigate to personal info */}}
        />
        
        <Divider />
        
        <List.Item
          title="Security"
          description="Password and authentication"
          left={props => <List.Icon {...props} icon="security" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* Navigate to security settings */}}
        />
        
        <Divider />
        
        <List.Item
          title="Connected Accounts"
          description="Manage bank connections"
          left={props => <List.Icon {...props} icon="account-balance" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* Navigate to connected accounts */}}
        />
      </Card.Content>
    </Card>
  );

  const renderAppSettings = () => (
    <Card style={styles.settingsCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <List.Item
          title="Notifications"
          description="Push notifications and alerts"
          left={props => <List.Icon {...props} icon="notifications" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
        />
        
        <Divider />
        
        <List.Item
          title="Biometric Login"
          description="Use fingerprint or face ID"
          left={props => <List.Icon {...props} icon="fingerprint" />}
          right={() => <Switch value={false} onValueChange={() => {}} />}
        />
        
        <Divider />
        
        <List.Item
          title="Dark Mode"
          description="Switch to dark theme"
          left={props => <List.Icon {...props} icon="dark-mode" />}
          right={() => <Switch value={false} onValueChange={() => {}} />}
        />
        
        <Divider />
        
        <List.Item
          title="Data Sync"
          description="Automatically sync your data"
          left={props => <List.Icon {...props} icon="sync" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
        />
      </Card.Content>
    </Card>
  );

  const renderSupportSettings = () => (
    <Card style={styles.settingsCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Support & Info</Text>
        
        <List.Item
          title="Help Center"
          description="Get help and support"
          left={props => <List.Icon {...props} icon="help" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* Navigate to help */}}
        />
        
        <Divider />
        
        <List.Item
          title="Privacy Policy"
          description="Read our privacy policy"
          left={props => <List.Icon {...props} icon="privacy-tip" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* Navigate to privacy policy */}}
        />
        
        <Divider />
        
        <List.Item
          title="Terms of Service"
          description="View terms and conditions"
          left={props => <List.Icon {...props} icon="description" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* Navigate to terms */}}
        />
        
        <Divider />
        
        <List.Item
          title="About"
          description="App version and info"
          left={props => <List.Icon {...props} icon="info" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {/* Navigate to about */}}
        />
      </Card.Content>
    </Card>
  );

  const renderDangerZone = () => (
    <Card style={[styles.settingsCard, styles.dangerCard]}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <Button 
          mode="outlined" 
          style={styles.dangerButton}
          textColor={theme.colors.error}
          onPress={handleLogout}
          icon="logout"
        >
          Sign Out
        </Button>
        
        <Button 
          mode="outlined" 
          style={[styles.dangerButton, { marginTop: theme.spacing.sm }]}
          textColor={theme.colors.error}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'This action cannot be undone. All your data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' },
              ]
            );
          }}
          icon="delete"
        >
          Delete Account
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderUserInfo()}
        {renderAccountSettings()}
        {renderAppSettings()}
        {renderSupportSettings()}
        {renderDangerZone()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  userCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  userInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  userName: {
    ...theme.typography.titleLarge,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  editProfileButton: {
    alignSelf: 'flex-start',
  },
  settingsCard: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    ...theme.typography.titleMedium,
    marginBottom: theme.spacing.sm,
    color: theme.colors.onSurface,
  },
  dangerCard: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  dangerButton: {
    borderColor: theme.colors.error,
  },
  bottomPadding: {
    height: theme.spacing.lg,
  },
});

export default ProfileScreen;