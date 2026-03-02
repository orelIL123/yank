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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Normalize phone: strip non-digits, add country code if starts with 0
  const normalizePhone = (input) => {
    const digits = (input || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('0')) return '972' + digits.slice(1);
    return digits;
  };

  // Build Firebase email from phone or real email
  const buildFirebaseEmail = (emailInput, phoneInput) => {
    const trimmedEmail = (emailInput || '').trim();
    if (trimmedEmail) return trimmedEmail;
    const norm = normalizePhone(phoneInput);
    return norm ? `${norm}@hayanuka.com` : null;
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('שגיאה', 'נא להזין שם מלא');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('שגיאה', 'נא להזין מספר טלפון');
      return;
    }
    if (!password || !confirmPassword) {
      Alert.alert('שגיאה', 'נא למלא סיסמה ואישור סיסמה');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
      return;
    }
    if (password.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    const firebaseEmail = buildFirebaseEmail(email, phone);
    if (!firebaseEmail) {
      Alert.alert('שגיאה', 'נא להזין מספר טלפון תקין');
      return;
    }

    const normalizedPhone = normalizePhone(phone);

    setLoading(true);
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: name.trim()
      });

      // Save user doc in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim().toLowerCase() || null,
        firebaseEmail,
        role: 'user',
        createdAt: new Date().toISOString(),
        unlockedCards: [],
      });

      // App.js will handle navigation via onAuthStateChanged
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'אירעה שגיאה בהרשמה';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = email.trim()
            ? 'כתובת האימייל כבר בשימוש'
            : 'מספר הטלפון כבר רשום במערכת';
          break;
        case 'auth/invalid-email':
          errorMessage = 'כתובת אימייל לא תקינה';
          break;
        case 'auth/weak-password':
          errorMessage = 'הסיסמה חלשה מדי';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'בעיית רשת. אנא נסה שוב';
          break;
      }

      Alert.alert('שגיאה', errorMessage);
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
          <View style={styles.content}>
            <Text style={styles.title}>הרשמה</Text>
            <Text style={styles.subtitle}>הצטרף לקהילת הינוקא</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>שם מלא</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="הזן שם מלא"
                placeholderTextColor="#666"
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>טלפון *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="הזן מספר טלפון"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>אימייל (אופציונלי)</Text>
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
                  placeholder="הזן סיסמה (לפחות 6 תווים)"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>אישור סיסמה</Text>
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
                  style={styles.inputWithIcon}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="הזן סיסמה שוב"
                  placeholderTextColor="#666"
                  secureTextEntry={!showConfirmPassword}
                  textAlign="right"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>הירשם</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                כבר יש לך חשבון? <Text style={styles.loginTextBold}>התחבר כעת</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={styles.guestButton}
            >
              <Text style={styles.guestButtonText}>המשך כאורח</Text>
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
  registerButton: {
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
  registerButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Heebo_700Bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
  },
  loginTextBold: {
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
