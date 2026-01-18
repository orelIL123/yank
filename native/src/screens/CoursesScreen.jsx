import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const NIGGUNIM = [
  {
    id: 'niggun-1',
    title: 'ניגון ראשון',
    level: 'ניגון',
    duration: '3:45',
    description: 'ניגון מיוחד מבית המדרש',
    cover: require('../../assets/icon.jpg'),
  },
  {
    id: 'niggun-2',
    title: 'ניגון שני',
    level: 'ניגון',
    duration: '4:12',
    description: 'ניגון מעורר השראה',
    cover: require('../../assets/icon.jpg'),
  },
  {
    id: 'niggun-3',
    title: 'ניגון שלישי',
    level: 'ניגון',
    duration: '5:30',
    description: 'ניגון של קדושה והתעלות',
    cover: require('../../assets/icon.jpg'),
  },
]

export default function CoursesScreen({ navigation }) {
  const onNiggunPress = (niggun) => {
    Alert.alert('בקרוב', `דמו בהמשך נחבר - ${niggun.title}`)
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>ניגונים</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>ניגונים מבית המדרש</Text>

        {NIGGUNIM.map((niggun, idx) => (
          <Pressable
            key={niggun.id}
            style={[styles.courseCard, idx === 0 && styles.courseCardFirst]}
            onPress={() => onNiggunPress(niggun)}
            accessibilityRole="button"
            accessibilityLabel={`ניגון ${niggun.title}`}
          >
            <ImageBackground source={niggun.cover} style={styles.coverImage} imageStyle={styles.coverImageRadius} pointerEvents="box-none">
              <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
              <View style={styles.courseLabelRow} pointerEvents="none">
                <View style={styles.levelPill}>
                  <Text style={styles.levelText}>{niggun.level}</Text>
                </View>
                <Ionicons name="musical-notes" size={28} color={PRIMARY_BLUE} />
              </View>
              <View style={styles.courseTextBlock} pointerEvents="none">
                <Text style={styles.courseTitle}>{niggun.title}</Text>
                <View style={styles.courseMetaRow}>
                  <Ionicons name="time-outline" size={14} color="#f3f4f6" />
                  <Text style={styles.courseMeta}>{niggun.duration}</Text>
                </View>
                <Text style={styles.courseDesc}>{niggun.description}</Text>
              </View>
            </ImageBackground>
          </Pressable>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="musical-notes" size={32} color={PRIMARY_BLUE} />
          <View style={styles.footerTextBlock}>
            <Text style={styles.footerTitle}>ניגונים נוספים</Text>
            <Text style={styles.footerDesc}>
              דמו בהמשך נחבר - ניגונים נוספים יופיעו כאן בקרוב.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  subtitle: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  courseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  courseCardFirst: {
    marginTop: 6,
  },
  coverImage: {
    height: 220,
    justifyContent: 'space-between',
  },
  coverImageRadius: {
    borderRadius: 20,
  },
  courseLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(30,58,138,0.18)',
  },
  levelText: {
    color: '#fdf3c2',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  courseTextBlock: {
    padding: 18,
    alignItems: 'flex-end',
    gap: 8,
  },
  courseTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseMeta: {
    color: '#f3f4f6',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  courseDesc: {
    color: '#f3f4f6',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
  footerCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  footerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  footerTitle: {
    color: DEEP_BLUE,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerDesc: {
    color: '#4b5563',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
})
