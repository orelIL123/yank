import React, { useState } from 'react';
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
  ScrollView,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { t } from '../utils/i18n';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Same as LoginScreen: allow number only -> number@hayanuka.com
  const normalizeEmail = (input) => {
    const trimmed = (input || '').trim();
    if (!trimmed) return trimmed;
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@hayanuka.com`;
  };

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert(t('שגיאה'), t('נא להזין את כתובת האימייל'));
      return;
    }

    setLoading(true);
    const emailToUse = normalizeEmail(email);
    Keyboard.dismiss();

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      Alert.alert(
        t('נשלח קישור לאיפוס'),
        t('נשלחה הודעה לאיפוס לאימייל שלך') + '\n\n' + t('לבדוק בתיקיית הספאם'),
        [
          {
            text: t('אישור'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      let errorMessage = t('אירעה שגיאה בשליחת קישור לאיפוס');

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = t('כתובת אימייל לא תקינה');
          break;
        case 'auth/user-not-found':
          errorMessage = t('לא נמצא משתמש עם כתובת אימייל זו');
          break;
        case 'auth/too-many-requests':
          errorMessage = t('ניסיונות רבים מדי. נסה שוב מאוחר יותר');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('בעיית רשת. אנא נסה שוב');
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-forward" size={24} color="#FFD700" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>{t('איפוס סיסמה')}</Text>
            <Text style={styles.subtitle}>
              {t('הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה')}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('אימייל')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('הזן אימייל')}
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSendReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1a1a2e" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {t('שלח קישור לאיפוס סיסמה')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.backLinkText}>{t('חזרה להתחברות')}</Text>
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
    justifyContent: 'center',
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Heebo_700Bold',
  },
  subtitle: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'Heebo_400Regular',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Heebo_500Medium',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    fontFamily: 'Heebo_400Regular',
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Heebo_700Bold',
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#FFD700',
    fontSize: 15,
    fontFamily: 'Heebo_500Medium',
    textDecorationLine: 'underline',
  },
});
