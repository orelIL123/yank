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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'נא למלא את כל השדות');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with email:', email.trim());
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
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
      
      let errorMessage = 'אירעה שגיאה בהתחברות';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'כתובת אימייל לא תקינה';
          break;
        case 'auth/user-disabled':
          errorMessage = 'משתמש זה הושבת';
          break;
        case 'auth/user-not-found':
          errorMessage = 'משתמש לא נמצא';
          break;
        case 'auth/wrong-password':
          errorMessage = 'סיסמה שגויה';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'בעיית רשת. אנא נסה שוב';
          break;
      }

      Alert.alert('שגיאה', errorMessage);
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
          <Text style={styles.title}>התחברות</Text>
          <Text style={styles.subtitle}>ברוכים השבים לאפליקציית הינוקא</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>אימייל</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="הזן אימייל"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>סיסמה</Text>
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
                placeholder="הזן סיסמה"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                textAlign="right"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>התחבר</Text>
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
