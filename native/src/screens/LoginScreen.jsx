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
  ScrollView,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { trackLogin } from '../services/analytics';
import { t } from '../utils/i18n';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Allow login with number only (e.g. 0512345678) -> 0512345678@hayanuka.com for Google Play test account
  const normalizeEmail = (input) => {
    const trimmed = (input || '').trim();
    if (!trimmed) return trimmed;
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@hayanuka.com`;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('שגיאה'), t('נא למלא את כל השדות'));
      return;
    }

    setLoading(true);
    const emailToUse = normalizeEmail(email);
    try {
      console.log('Attempting login with email:', emailToUse);
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      console.log('Login successful! User:', userCredential.user.uid);
      trackLogin(userCredential.user.uid, 'email');
      console.log('Firebase Auth persists session automatically - user will stay logged in');
      
      Keyboard.dismiss();
      
      // Give App.js a moment to detect auth state change, then navigate
      setTimeout(() => {
        if (navigation) {
          console.log('Navigating to Home after login');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = t('אירעה שגיאה בהתחברות');

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = t('כתובת אימייל לא תקינה');
          break;
        case 'auth/user-disabled':
          errorMessage = t('משתמש זה הושבת');
          break;
        case 'auth/user-not-found':
          errorMessage = t('משתמש לא נמצא');
          break;
        case 'auth/wrong-password':
          errorMessage = t('סיסמה שגויה');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('בעיית רשת. אנא נסה שוב');
          break;
      }

      Alert.alert(t('שגיאה'), errorMessage);
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
          <View style={styles.content}>
          <Text style={styles.title}>{t('התחברות')}</Text>
          <Text style={styles.subtitle}>{t('ברוכים השבים לאפליקציית הינוקא')}</Text>

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
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('סיסמה')}</Text>
            <View style={styles.passwordInputContainer}>
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#FFD700"
                />
              </TouchableOpacity>
              <TextInput
                style={styles.inputWithIcon}
                value={password}
                onChangeText={setPassword}
                placeholder={t('הזן סיסמה')}
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                textAlign="right"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotLinkText}>{t('שכחתי סיסמה')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>{t('התחבר')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              {t('אין לך חשבון?')} <Text style={styles.registerTextBold}>{t('הירשם עכשיו')}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.guestButtonText}>{t('המשך כאורח')}</Text>
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
  content: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Heebo_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
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
  loginButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Heebo_700Bold',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotLinkText: {
    color: '#FFD700',
    fontSize: 14,
    fontFamily: 'Heebo_500Medium',
    textDecorationLine: 'underline',
  },
  registerText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
  },
  registerTextBold: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'Heebo_700Bold',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  inputWithIcon: {
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
  guestButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Heebo_500Medium',
    textDecorationLine: 'underline',
  },
});
