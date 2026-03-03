import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { t } from '../utils/i18n';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if user is logged in, redirect to login if not
  useEffect(() => {
    if (!auth.currentUser) {
      Alert.alert(t('נדרש התחברות'), t('עליך להתחבר כדי לשנות את הסיסמה'), [
        {
          text: t('אישור'),
          onPress: () => navigation.navigate('Login')
        }
      ]);
    }
  }, [navigation]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('שגיאה'), t('נא למלא את כל השדות'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('שגיאה'), t('הסיסמה החדשה ואישור הסיסמה אינם תואמים'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('שגיאה'), t('הסיסמה החדשה חייבת להכיל לפחות 6 תווים'));
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(t('שגיאה'), t('הסיסמה החדשה זהה לסיסמה הנוכחית'));
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error(t('משתמש לא מחובר'));
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      Alert.alert(
        t('הצלחה!'),
        t('הסיסמה שונתה בהצלחה'),
        [
          {
            text: t('אישור'),
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Change password error:', error);
      let errorMessage = t('אירעה שגיאה בשינוי הסיסמה');

      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = t('הסיסמה הנוכחית שגויה');
          break;
        case 'auth/weak-password':
          errorMessage = t('הסיסמה החדשה חלשה מדי');
          break;
        case 'auth/requires-recent-login':
          errorMessage = t('נדרשת התחברות מחדש. אנא התחבר שוב ונסה שנית');
          break;
      }

      Alert.alert(t('שגיאה'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-forward" size={24} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('שינוי סיסמה')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={60} color="#FFD700" />
            </View>

            <Text style={styles.subtitle}>{t('הזן סיסמה נוכחית וסיסמה חדשה')}</Text>

            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('סיסמה נוכחית')}</Text>
              <View style={styles.passwordInputContainer}>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#FFD700"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={t('הזן סיסמה נוכחית')}
                  placeholderTextColor="#666"
                  secureTextEntry={!showCurrentPassword}
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('סיסמה חדשה')}</Text>
              <View style={styles.passwordInputContainer}>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#FFD700"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t('הזן סיסמה חדשה (לפחות 6 תווים)')}
                  placeholderTextColor="#666"
                  secureTextEntry={!showNewPassword}
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('אישור סיסמה חדשה')}</Text>
              <View style={styles.passwordInputContainer}>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#FFD700"
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('הזן סיסמה חדשה שוב')}
                  placeholderTextColor="#666"
                  secureTextEntry={!showConfirmPassword}
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#FFD700" />
              <Text style={styles.infoText}>
                {t('הסיסמה חייבת להכיל לפחות 6 תווים')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.changeButtonText}>{t('שנה סיסמה')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Heebo_700Bold',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Heebo_400Regular',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Heebo_500Medium',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    paddingLeft: 50,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    fontFamily: 'Heebo_400Regular',
  },
  eyeButton: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },
  infoBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#FFD700',
    marginRight: 10,
    textAlign: 'right',
    flex: 1,
    fontFamily: 'Heebo_400Regular',
  },
  changeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  changeButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Heebo_700Bold',
  },
});
