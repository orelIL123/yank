import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function HelpSupportScreen({ navigation }) {
  const handleCall = () => {
    Linking.openURL('tel:054-8434755')
  }

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/972548434755')
  }

  const handleEmail = () => {
    Linking.openURL('mailto:support@hayanuka.com?subject=תמיכה טכנית')
  }

  const handleWebsite = () => {
    Linking.openURL('https://hayanuka.com')
  }

  const faqs = [
    {
      question: 'איך אני מתחבר לחשבון?',
      answer: 'לחץ על כפתור "התחבר לחשבון" בעמוד הפרופיל והכנס את פרטי ההתחברות שלך.'
    },
    {
      question: 'איך אני משנה את הסיסמה?',
      answer: 'לך לעמוד הפרופיל, לחץ על "אבטחה וסיסמה" ובחר "שנה סיסמה".'
    },
    {
      question: 'איך אני מבקש תפילה?',
      answer: 'לך לעמוד "תפילות" ולחץ על "בקש תפילה". מלא את הפרטים והבקשה תועבר לקהילה.'
    },
    {
      question: 'איך אני מוחק את החשבון שלי?',
      answer: 'לך לעמוד הפרופיל, גלול למטה ולחץ על "מחק חשבון". שים לב שפעולה זו אינה הפיכה.'
    }
  ]

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          style={styles.backButton}
          hitSlop={12}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-forward" size={28} color={DEEP_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>עזרה ותמיכה</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>צור קשר</Text>
          
          <Pressable style={styles.contactCard} onPress={handleCall} accessibilityRole="button">
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={24} color={PRIMARY_BLUE} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>טלפון</Text>
              <Text style={styles.contactValue}>054-8434755</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable style={styles.contactCard} onPress={handleWhatsApp} accessibilityRole="button">
            <View style={styles.contactIcon}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>WhatsApp</Text>
              <Text style={styles.contactValue}>054-8434755</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable style={styles.contactCard} onPress={handleEmail} accessibilityRole="button">
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color={PRIMARY_BLUE} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>אימייל</Text>
              <Text style={styles.contactValue}>support@hayanuka.com</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable style={styles.contactCard} onPress={handleWebsite} accessibilityRole="button">
            <View style={styles.contactIcon}>
              <Ionicons name="globe-outline" size={24} color={PRIMARY_BLUE} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>אתר אינטרנט</Text>
              <Text style={styles.contactValue}>hayanuka.com</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>שאלות נפוצות</Text>
          
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingTop: Platform.select({ ios: 48, android: 34, default: 42 }),
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 16,
    textAlign: 'right',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30,58,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  contactInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contactTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  faqQuestion: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    lineHeight: 20,
    textAlign: 'right',
  },
})

