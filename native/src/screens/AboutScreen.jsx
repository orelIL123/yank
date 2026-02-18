import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

export default function AboutScreen({ navigation }) {
  const [playingVideo, setPlayingVideo] = useState(false);
  const YOUTUBE_VIDEO_ID = '1peYrCBdaNI'; // Extracted from: https://youtu.be/1peYrCBdaNI
  
  // YouTube Player state handler
  const onStateChange = (state) => {
    if (state === 'playing') {
      setPlayingVideo(true);
    } else if (state === 'paused' || state === 'ended') {
      setPlayingVideo(false);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:054-8434755');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/972548434755');
  };

  const handleWebsite = () => {
    Linking.openURL('https://hayanuka.com');
  };

  const handleYouTube = () => {
    Linking.openURL('https://youtube.com/@hayanuka');
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-forward" size={24} color="#FFD700" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>על הגאון הינוקא</Text>
          <View style={styles.divider} />
        </View>

        {/* YouTube Video Section */}
        <View style={styles.videoSection}>
          <Text style={styles.videoTitle}>תיעוד מחייו ואורחותיו של הגאון הינוקא שליט״א</Text>
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={220}
              videoId={YOUTUBE_VIDEO_ID}
              play={playingVideo}
              onChangeState={onStateChange}
              webViewStyle={{ opacity: 0.99 }}
            />
          </View>
          <TouchableOpacity 
            style={styles.openYoutubeButton}
            onPress={() => Linking.openURL(`https://youtu.be/${YOUTUBE_VIDEO_ID}`)}
          >
            <Ionicons name="open-outline" size={20} color="#FFD700" />
            <Text style={styles.openYoutubeText}>פתח ב-YouTube</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}></Text>
          <Text style={styles.description}>
          נולד בשנת 1988 בישראל, הרב שלמה יהודה בארי המכונה - ׳הינוקא׳ - (כינוי לילד פלא),
            הוא תלמיד חכם מפורסם עם יכולות יוצאות דופן מגיל צעיר.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מחזה שלא נראה דורות</Text>
          <Text style={styles.quoteText}>
            "מחזה שלא נראה כבר דורות - תלמיד חכם צעיר הבקי בתורה כולה, שלפניו יושבים
            זקנים וגדולי תורה לשמוע דבריו"
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ילדותו וצמיחתו</Text>
          <Text style={styles.description}>
            • צאצא האר"י הקדוש
          </Text>
          <Text style={styles.description}>
            • גר בספרד בילדותו, עבר בין ערים כמו ג'רונה וסביליה
          </Text>
          <Text style={styles.description}>
            • התמודד עם אתגרים כלכליים בגדלו
          </Text>
          <Text style={styles.description}>
            • בילה את רוב ילדותו בקריאה ולימוד טקסטים דתיים
          </Text>
          <Text style={styles.description}>
            • החל לכתוב חידושי תורה ולאסוף תמונות של צדיקים מגיל 6
          </Text>
          <Text style={styles.description}>
            • חזר לישראל בגיל 14, כשהוא כבר בעל ידע עמוק בטקסטים דתיים
          </Text>
          <Text style={styles.description}>
            • החל למסור שיעורים בגיל צעיר
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>אופי שיעוריו</Text>
          <Text style={styles.description}>
            שיעוריו מתאפיינים ב:
          </Text>
          <Text style={styles.description}>
            • מסירה ספונטנית וללא הכנה מוקדמת
          </Text>
          <Text style={styles.description}>
            • ציטוט מאות מקורות מרחבי הספרות היהודית
          </Text>
          <Text style={styles.description}>
            • שזירה של נקודות מבט רבניות שונות
          </Text>
          <Text style={styles.description}>
            • התמקדות בצמיחה רוחנית וחיבור לקדוש ברוך הוא
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מסרים ייחודיים</Text>
          <Text style={styles.description}>
            הרב מדגיש:
          </Text>
          <Text style={styles.description}>
            • אחדות ואהבת ישראל
          </Text>
          <Text style={styles.description}>
            • כבוד ואהבה לכל אדם
          </Text>
          <Text style={styles.description}>
            • גישור בין מסורות יהודיות שונות
          </Text>
          <Text style={styles.description}>
            • מפורסם בברכותיו המיוחדות ובכישרונותיו המוזיקליים
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>שירותי האתר</Text>
          <View style={styles.serviceItem}>
            <Ionicons name="videocam" size={20} color="#FFD700" />
            <Text style={styles.serviceText}>שיעורי וידאו מעמיקים בתורה</Text>
          </View>
          <View style={styles.serviceItem}>
            <Ionicons name="musical-notes" size={20} color="#FFD700" />
            <Text style={styles.serviceText}>הקלטות מוזיקליות ונגינות קודש</Text>
          </View>
          <View style={styles.serviceItem}>
            <Ionicons name="book" size={20} color="#FFD700" />
            <Text style={styles.serviceText}>קונטרסים וחומרי לימוד</Text>
          </View>
          <View style={styles.serviceItem}>
            <Ionicons name="heart" size={20} color="#FFD700" />
            <Text style={styles.serviceText}>משאבי תפילה ותיקוני מידות</Text>
          </View>
          <View style={styles.serviceItem}>
            <Ionicons name="information-circle" size={20} color="#FFD700" />
            <Text style={styles.serviceText}>מידע ביוגרפי על הרב</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>קהילת הינוקא</Text>
          <Text style={styles.description}>
            קהילה גדולה של מאמינים ותלמידי חכמים עוקבת אחר הוראותיו של הגאון הינוקא.
            האפליקציה מאפשרת גישה נוחה לכל התכנים, השיעורים והתפילות, ומחברת את הקהילה
            באמצעות התראות חיות ועדכונים שוטפים.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>צור קשר</Text>

          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#1a1a2e" />
            <Text style={styles.contactButtonText}>התקשר: 054-8434755</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color="#1a1a2e" />
            <Text style={styles.contactButtonText}>קבוצות וואטסאפ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton} onPress={handleWebsite}>
            <Ionicons name="globe" size={24} color="#1a1a2e" />
            <Text style={styles.contactButtonText}>hayanuka.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton} onPress={handleYouTube}>
            <Ionicons name="logo-youtube" size={24} color="#1a1a2e" />
            <Text style={styles.contactButtonText}>ערוץ יוטיוב</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            זכות גדולה להיות חלק מקהילת הינוקא
          </Text>
          <Text style={styles.footerSubText}>
            ברוכים הבאים לאפליקציה הרשמית
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Heebo_700Bold',
  },
  divider: {
    width: 100,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  section: {
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'right',
    fontFamily: 'Heebo_700Bold',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 26,
    textAlign: 'right',
    marginBottom: 10,
    fontFamily: 'Heebo_400Regular',
  },
  serviceItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  serviceText: {
    fontSize: 16,
    color: '#fff',
    marginRight: 12,
    textAlign: 'right',
    fontFamily: 'Heebo_400Regular',
  },
  contactSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginRight: 10,
    fontFamily: 'Heebo_700Bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Heebo_600SemiBold',
  },
  footerSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: 'Heebo_400Regular',
  },
  quoteText: {
    fontSize: 18,
    color: '#FFD700',
    lineHeight: 28,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
    fontFamily: 'Heebo_500Medium',
  },
  videoSection: {
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Heebo_700Bold',
  },
  videoContainer: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    width: '100%',
    height: 220,
  },
  openYoutubeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  openYoutubeText: {
    fontSize: 14,
    color: '#FFD700',
    marginRight: 8,
    fontFamily: 'Heebo_600SemiBold',
  },
});
