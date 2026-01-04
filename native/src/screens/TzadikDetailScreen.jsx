import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Alert,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import db from '../services/database';

const PRIMARY_BLUE = '#1e3a8a';
const BG = '#FFFFFF';
const DEEP_BLUE = '#0b1b3a';
const { width } = Dimensions.get('window');

export default function TzadikDetailScreen({ route, navigation }) {
  const { tzadik } = route.params || {};
  const [imageError, setImageError] = useState(false);

  // Track view count
  React.useEffect(() => {
    if (tzadik?.id) {
      // Increment view count using database service
      db.incrementField('tzadikim', tzadik.id, 'viewCount', 1)
        .catch(err => console.error('Error updating view count:', err));
    }
  }, [tzadik?.id]);

  if (!tzadik) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>פרטי צדיק</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>לא נמצא מידע על הצדיק</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      const shareContent = `${tzadik.name}${tzadik.title ? ` - ${tzadik.title}` : ''}\n${tzadik.biography || ''}`;
      await Share.share({
        message: shareContent,
        title: tzadik.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tzadik.name || 'פרטי צדיק'}
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={24} color={PRIMARY_BLUE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Image */}
        {tzadik.imageUrl && !imageError && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: tzadik.imageUrl }}
              style={styles.mainImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}

        {/* Name and Title */}
        <View style={styles.titleSection}>
          <Text style={styles.name}>{tzadik.name}</Text>
          {tzadik.title && (
            <Text style={styles.title}>{tzadik.title}</Text>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          {tzadik.location && (
            <View style={styles.infoCard}>
              <Ionicons name="location-outline" size={20} color={PRIMARY_BLUE} />
              <Text style={styles.infoLabel}>מיקום</Text>
              <Text style={styles.infoValue}>{tzadik.location}</Text>
            </View>
          )}
          
          {tzadik.birthDate && (
            <View style={styles.infoCard}>
              <Ionicons name="calendar-outline" size={20} color={PRIMARY_BLUE} />
              <Text style={styles.infoLabel}>תאריך לידה</Text>
              <Text style={styles.infoValue}>{formatDate(tzadik.birthDate)}</Text>
            </View>
          )}
          
          {tzadik.deathDate && (
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={20} color={PRIMARY_BLUE} />
              <Text style={styles.infoLabel}>תאריך פטירה</Text>
              <Text style={styles.infoValue}>{formatDate(tzadik.deathDate)}</Text>
            </View>
          )}

          {tzadik.period && (
            <View style={styles.infoCard}>
              <Ionicons name="hourglass-outline" size={20} color={PRIMARY_BLUE} />
              <Text style={styles.infoLabel}>תקופה</Text>
              <Text style={styles.infoValue}>{tzadik.period}</Text>
            </View>
          )}
        </View>

        {/* Biography */}
        {tzadik.biography && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תולדות חייו</Text>
            <Text style={styles.biography}>{tzadik.biography}</Text>
          </View>
        )}

        {/* Additional Information */}
        {tzadik.additionalInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>מידע נוסף</Text>
            <Text style={styles.biography}>{tzadik.additionalInfo}</Text>
          </View>
        )}

        {/* Books/Works */}
        {tzadik.books && tzadik.books.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>חיבורים וספרים</Text>
            {tzadik.books.map((book, index) => (
              <View key={index} style={styles.bookItem}>
                <Ionicons name="book-outline" size={18} color={PRIMARY_BLUE} />
                <Text style={styles.bookText}>{book}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Links */}
        {(tzadik.sourceUrl || tzadik.wikiUrl) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>קישורים</Text>
            {tzadik.sourceUrl && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Linking.openURL(tzadik.sourceUrl)}
              >
                <Ionicons name="link-outline" size={18} color={PRIMARY_BLUE} />
                <Text style={styles.linkText}>מקור מידע</Text>
                <Ionicons name="chevron-forward" size={18} color={PRIMARY_BLUE} />
              </TouchableOpacity>
            )}
            {tzadik.wikiUrl && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Linking.openURL(tzadik.wikiUrl)}
              >
                <Ionicons name="logo-wikipedia" size={18} color={PRIMARY_BLUE} />
                <Text style={styles.linkText}>עמוד בוויקיפדיה</Text>
                <Ionicons name="chevron-forward" size={18} color={PRIMARY_BLUE} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Gallery - Additional Images */}
        {tzadik.gallery && tzadik.gallery.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>גלריית תמונות</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {tzadik.gallery.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
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
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,58,138,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,58,138,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
    textAlign: 'right',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    marginBottom: 12,
    textAlign: 'right',
  },
  biography: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    lineHeight: 26,
    textAlign: 'right',
  },
  bookItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  bookText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: DEEP_BLUE,
    marginRight: 8,
    textAlign: 'right',
  },
  linkButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
    marginRight: 8,
    textAlign: 'right',
  },
  gallery: {
    marginTop: 8,
  },
  galleryImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  footer: {
    height: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
});

