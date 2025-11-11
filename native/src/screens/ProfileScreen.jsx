import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const GOLD = '#E63946'
const BG = '#FFFFFF'
const DEEP_BLUE = '#2D6A4F'

export default function ProfileScreen({ navigation }) {
  return (
    <View style={styles.screen}>
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
        <Text style={styles.headerTitle}>פרופיל</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={60} color={GOLD} />
          </View>
          <Text style={styles.userName}>משתמש אורח</Text>
          <Text style={styles.userEmail}>guest@naorbaruch.com</Text>
        </View>

        {/* Profile Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הגדרות חשבון</Text>

          <Pressable style={styles.optionCard} accessibilityRole="button">
            <View style={styles.optionContent}>
              <View style={styles.optionRight}>
                <Ionicons name="chevron-back" size={20} color="#9ca3af" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>פרטים אישיים</Text>
                  <Text style={styles.optionDesc}>שם, אימייל ופרטי התקשרות</Text>
                </View>
              </View>
              <View style={styles.optionIcon}>
                <Ionicons name="person-outline" size={22} color={GOLD} />
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.optionCard} accessibilityRole="button">
            <View style={styles.optionContent}>
              <View style={styles.optionRight}>
                <Ionicons name="chevron-back" size={20} color="#9ca3af" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>אבטחה וסיסמה</Text>
                  <Text style={styles.optionDesc}>שינוי סיסמה והגדרות אבטחה</Text>
                </View>
              </View>
              <View style={styles.optionIcon}>
                <Ionicons name="lock-closed-outline" size={22} color={GOLD} />
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.optionCard} accessibilityRole="button">
            <View style={styles.optionContent}>
              <View style={styles.optionRight}>
                <Ionicons name="chevron-back" size={20} color="#9ca3af" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>התראות</Text>
                  <Text style={styles.optionDesc}>העדפות התראות ופוש</Text>
                </View>
              </View>
              <View style={styles.optionIcon}>
                <Ionicons name="notifications-outline" size={22} color={GOLD} />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מנוי</Text>

          <View style={styles.subscriptionCard}>
            <LinearGradient
              colors={['#2D6A4F', '#40916C']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.subscriptionContent}>
              <Ionicons name="star" size={32} color={GOLD} />
              <Text style={styles.subscriptionTitle}>חבר פרימיום</Text>
              <Text style={styles.subscriptionDesc}>
                גישה מלאה לכל התכנים, התראות והקהילה
              </Text>
              <Pressable style={styles.upgradeButton} accessibilityRole="button">
                <Text style={styles.upgradeButtonText}>שדרג מנוי</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>נוספים</Text>

          <Pressable style={styles.optionCard} accessibilityRole="button">
            <View style={styles.optionContent}>
              <View style={styles.optionRight}>
                <Ionicons name="chevron-back" size={20} color="#9ca3af" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>עזרה ותמיכה</Text>
                  <Text style={styles.optionDesc}>שאלות נפוצות וצור קשר</Text>
                </View>
              </View>
              <View style={styles.optionIcon}>
                <Ionicons name="help-circle-outline" size={22} color={GOLD} />
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.optionCard} accessibilityRole="button">
            <View style={styles.optionContent}>
              <View style={styles.optionRight}>
                <Ionicons name="chevron-back" size={20} color="#9ca3af" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>אודות</Text>
                  <Text style={styles.optionDesc}>גרסה ותנאי שימוש</Text>
                </View>
              </View>
              <View style={styles.optionIcon}>
                <Ionicons name="information-circle-outline" size={22} color={GOLD} />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Pressable style={styles.logoutButton} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
            <Text style={styles.logoutText}>התנתק</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: GOLD,
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 12,
    textAlign: 'right',
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionText: {
    alignItems: 'flex-end',
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionCard: {
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 180,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  subscriptionContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: GOLD,
    marginTop: 12,
    marginBottom: 8,
  },
  subscriptionDesc: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: GOLD,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220,38,38,0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#dc2626',
  },
})
