import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AppHeader from '../components/AppHeader';

const COLORS = {
  primaryRed: '#DC2626',
  deepBlue: '#0b1b3a',
  bg: '#f9fafb',
  white: '#FFFFFF',
  text: '#111827',
  textLight: '#6B7280',
  cardBg: '#FFFFFF',
};

const FONTS = {
  bold: 'Poppins_700Bold',
  semiBold: 'Poppins_600SemiBold',
  medium: 'Poppins_500Medium',
  regular: 'Poppins_400Regular',
};

// Calculate compass direction to Jerusalem
function calculateBearingToJerusalem(userLat, userLon) {
  const jerusalemLat = 31.7683;
  const jerusalemLon = 35.2137;

  const dLon = (jerusalemLon - userLon) * Math.PI / 180;
  const lat1 = userLat * Math.PI / 180;
  const lat2 = jerusalemLat * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

// Get compass direction name in Hebrew
function getDirectionName(bearing) {
  const directions = [
    'צפון', 'צפון-מזרח', 'מזרח', 'דרום-מזרח',
    'דרום', 'דרום-מערב', 'מערב', 'צפון-מערב'
  ];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

export default function ToolsScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bearing, setBearing] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('שגיאה', 'יש לאפשר גישה למיקום כדי להשתמש במצפן וזמני היום');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      const bearingToJerusalem = calculateBearingToJerusalem(
        location.coords.latitude,
        location.coords.longitude
      );
      setBearing(bearingToJerusalem);

      // Load prayer times
      await loadPrayerTimes(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('שגיאה', 'לא ניתן לקבל מיקום');
    } finally {
      setLoading(false);
    }
  };

  const loadPrayerTimes = async (lat, lon) => {
    try {
      // Using Hebcal API for prayer times
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const url = `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${year}-${month}-${day}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.times) {
        setPrayerTimes({
          alotHaShachar: formatTime(data.times.alotHaShachar),
          sunrise: formatTime(data.times.sunrise),
          sofZmanShma: formatTime(data.times.sofZmanShma),
          sofZmanTfilla: formatTime(data.times.sofZmanTfilla),
          chatzot: formatTime(data.times.chatzot),
          minchaGedola: formatTime(data.times.minchaGedola),
          minchaKetana: formatTime(data.times.minchaKetana),
          sunset: formatTime(data.times.sunset),
          tzeit: formatTime(data.times.tzeit),
        });
      }
    } catch (error) {
      console.error('Error loading prayer times:', error);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const tools = [
    {
      id: 'siddur',
      title: 'סידור תפילה',
      description: 'סידור תפילה מלא מספריית ספריא',
      icon: 'book-outline',
      color: '#3B82F6',
      onPress: () => navigation.navigate('Siddur'),
    },
    {
      id: 'times',
      title: 'זמני היום',
      description: 'זמני התפילה והזריחה למיקום שלך',
      icon: 'time-outline',
      color: '#F59E0B',
      type: 'times',
    },
    {
      id: 'compass',
      title: 'מצפן לירושלים',
      description: 'כיוון התפילה לירושלים',
      icon: 'compass-outline',
      color: '#10B981',
      type: 'compass',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[COLORS.bg, '#f3f4f6']} style={StyleSheet.absoluteFill} />

      <AppHeader
        title="כלי עזר"
        showBackButton={true}
        onBackPress={handleBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>כלי עזר לתפילה ולימוד</Text>
          <Text style={styles.subtitle}>סידור, זמני היום ומצפן לירושלים</Text>
        </View>

        {/* Tools List */}
        <View style={styles.toolsContainer}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={tool.onPress}
              activeOpacity={0.7}
              disabled={loading && (tool.type === 'times' || tool.type === 'compass')}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${tool.color}15` }]}>
                  <Ionicons name={tool.icon} size={32} color={tool.color} />
                </View>

                <View style={styles.cardTextContainer}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>

                  {/* Show prayer times */}
                  {tool.type === 'times' && prayerTimes && (
                    <View style={styles.timesContainer}>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.alotHaShachar}</Text>
                        <Text style={styles.timeLabel}>עלות השחר:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.sunrise}</Text>
                        <Text style={styles.timeLabel}>הנץ החמה:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.sofZmanShma}</Text>
                        <Text style={styles.timeLabel}>סוף זמן שמע:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.sofZmanTfilla}</Text>
                        <Text style={styles.timeLabel}>סוף זמן תפילה:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.chatzot}</Text>
                        <Text style={styles.timeLabel}>חצות:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.minchaGedola}</Text>
                        <Text style={styles.timeLabel}>מנחה גדולה:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.minchaKetana}</Text>
                        <Text style={styles.timeLabel}>מנחה קטנה:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.sunset}</Text>
                        <Text style={styles.timeLabel}>שקיעה:</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeValue}>{prayerTimes.tzeit}</Text>
                        <Text style={styles.timeLabel}>צאת הכוכבים:</Text>
                      </View>
                    </View>
                  )}

                  {/* Show compass */}
                  {tool.type === 'compass' && bearing !== null && (
                    <View style={styles.compassContainer}>
                      <View style={styles.compassCircle}>
                        <Ionicons
                          name="arrow-up"
                          size={48}
                          color={tool.color}
                          style={{ transform: [{ rotate: `${bearing}deg` }] }}
                        />
                      </View>
                      <Text style={styles.compassText}>
                        כיוון: {getDirectionName(bearing)} ({Math.round(bearing)}°)
                      </Text>
                      <Text style={styles.compassSubtext}>
                        הכיוון לירושלים מהמיקום שלך
                      </Text>
                    </View>
                  )}

                  {/* Show loading */}
                  {loading && (tool.type === 'times' || tool.type === 'compass') && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={tool.color} />
                      <Text style={styles.loadingText}>טוען מיקום...</Text>
                    </View>
                  )}
                </View>

                {tool.onPress && (
                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.deepBlue,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  toolsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  toolCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  cardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  cardTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  toolTitle: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: COLORS.deepBlue,
    textAlign: 'right',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: COLORS.textLight,
    textAlign: 'right',
    marginBottom: 12,
  },
  arrowContainer: {
    alignSelf: 'center',
    marginLeft: 12,
  },
  timesContainer: {
    marginTop: 12,
    width: '100%',
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.05)',
  },
  timeLabel: {
    fontSize: 15,
    fontFamily: 'Heebo_500Medium',
    color: COLORS.text,
    textAlign: 'right',
  },
  timeValue: {
    fontSize: 15,
    fontFamily: 'Heebo_600SemiBold',
    color: COLORS.deepBlue,
    textAlign: 'left',
  },
  compassContainer: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  compassCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  compassText: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: COLORS.deepBlue,
    textAlign: 'center',
    marginBottom: 4,
  },
  compassSubtext: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: COLORS.textLight,
  },
});
