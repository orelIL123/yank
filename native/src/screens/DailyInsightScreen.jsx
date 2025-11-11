import React from 'react'
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView, Share } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const GOLD = '#E63946'
const BG = '#FFFFFF'
const DEEP_BLUE = '#2D6A4F'

const todayInsight = {
  title: 'הכוח של סבלנות במסחר',
  date: new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  readTime: '2 דקות קריאה',
  category: 'Mindset',
  author: 'טל פרטוק',
  content: `המסחר הוא מרתון, לא ספרינט.

כשאתה מתחיל את הדרך, אתה רוצה תוצאות מהירות. אתה רוצה לראות את החשבון גדל כל יום, לחוש את ההצלחה מיד. אבל האמת היא שהמסחר המצליח בנוי על סבלנות, משמעת, ואמונה בתהליך.

כל טריידר מצליח עבר את התקופות הקשות. את הימים שבהם השוק נע נגדו, את השבועות שבהם הכל נראה אפור. אבל מה שמייחד אותם זה שהם לא ויתרו.

הם הבינו משהו פשוט אך עמוק:
• הצלחה במסחר היא תוצאה של עקביות לאורך זמן
• כל טעות היא שיעור
• כל יום הוא הזדמנות חדשה

אז היום, תזכור:
אתה לא מתחרה עם אף אחד חוץ מעצמך אתמול.
התמקד בתהליך, לא רק בתוצאה.
סבלנות + משמעת = הצלחה.

💪 המשך לצמוח, המשך להאמין.`,
}

export default function DailyInsightScreen({ navigation }) {
  const handleShare = React.useCallback(() => {
    Share.share({ message: `${todayInsight.title}\n\n${todayInsight.content}\n\n— ${todayInsight.author}` }).catch(() => {})
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.headerTitle}>ערך יומי</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{todayInsight.category}</Text>
          </View>

          <Text style={styles.title}>{todayInsight.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={GOLD} style={styles.metaIcon} />
              <Text style={styles.metaText}>{todayInsight.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={GOLD} style={styles.metaIcon} />
              <Text style={styles.metaText}>{todayInsight.readTime}</Text>
            </View>
          </View>

          <View style={styles.body}>
            {todayInsight.content.split('\n\n').map((para, idx) => (
              <Text key={idx} style={styles.paragraph}>{para}</Text>
            ))}
          </View>

          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>NB</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{todayInsight.author}</Text>
              <Text style={styles.authorTitle}>Trader • Mentor • Faith</Text>
            </View>
            <Pressable style={styles.shareBtn} onPress={handleShare} accessibilityRole="button">
              <Ionicons name="share-social-outline" size={16} color="#fff" />
              <Text style={styles.shareText}>שיתוף</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.nextReminder}>
          <Text style={styles.reminderText}>💫 התובנה הבאה תגיע מחר בשעה 08:00</Text>
          <Text style={styles.reminderSub}>הפעל התראות כדי לקבל אותה בזמן אמת</Text>
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
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: GOLD,
  },
  content: {
    padding: 20,
    paddingBottom: 64,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  categoryChip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.14)',
  },
  categoryText: {
    color: GOLD,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 18,
    textAlign: 'right',
    color: DEEP_BLUE,
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    marginTop: 18,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    marginTop: 1,
  },
  metaText: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  body: {
    marginTop: 20,
    gap: 16,
  },
  paragraph: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'right',
    fontFamily: 'Poppins_400Regular',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  authorInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  authorName: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  authorTitle: {
    marginTop: 2,
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  shareText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  nextReminder: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    gap: 6,
  },
  reminderText: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  reminderSub: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
})
