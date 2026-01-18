import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { db } from '../services/database';
import YoutubePlayer from 'react-native-youtube-iframe';
import AppHeader from '../components/AppHeader';
import { t } from '../utils/i18n';

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const { width } = Dimensions.get('window');

function openSocialLink(url) {
  if (!url) return;
  Linking.openURL(url).catch((err) => {
    console.error('Error opening social link:', err);
    Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור כעת');
  });
}

export default function MusicScreen({ navigation }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [playingSongId, setPlayingSongId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [youtubeId, setYoutubeId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadSongs();

    // Set audio mode for playback
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('Audio mode set successfully');
      } catch (error) {
        console.error('Error setting audio mode:', error);
      }
    };
    setupAudio();

    // Simple admin detection (adjust if you pass userRole into this screen)
    // Here we assume admin מגיע דרך פרופס navigation (route params) או גלובלית בעתיד
    const role = navigation?.getParent?.()?.getState?.()?.routes?.[0]?.params?.userRole;
    if (role === 'admin') {
      setIsAdmin(true);
    }

    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    // Update playback status
    if (sound) {
      sound.setOnPlaybackStatusUpdate((status) => {
        setPlaybackStatus(status);
        setIsPlaying(status.isLoaded && status.isPlaying);
        if (status.didJustFinish) {
          setPlayingSongId(null);
          setIsPlaying(false);
        }
      });
    }
  }, [sound]);

  const loadSongs = async () => {
    try {
      const songsData = await db.getCollection('music', {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      setSongs(songsData);
    } catch (error) {
      console.error('Error loading songs:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את הניגונים');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song) => {
    try {
      // Stop current audio if playing
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // If it's a YouTube video
      if (song.youtubeId) {
        setPlayingSongId(song.id);
        setYoutubeId(song.youtubeId);
        setIsPlaying(true);
        return;
      }

      // If it's an audio file
      setYoutubeId(null); // Clear YouTube ID

      // If same song is playing, pause/resume it
      if (playingSongId === song.id && sound) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        return;
      }

      // Check if song has audioUrl
      if (!song.audioUrl || !song.audioUrl.trim()) {
        Alert.alert('שגיאה', 'קובץ השמע לא זמין עבור ניגון זה');
        return;
      }

      // Validate URL
      if (!song.audioUrl.startsWith('http://') && !song.audioUrl.startsWith('https://')) {
        Alert.alert('שגיאה', 'קישור לא תקין לניגון זה');
        console.error('Invalid audioUrl:', song.audioUrl);
        return;
      }

      console.log('Loading audio from:', song.audioUrl);

      // Load and play new song
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        }
      );

      // Set up playback status listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          setPlaybackStatus(status);
          if (status.didJustFinish) {
            setPlayingSongId(null);
            setIsPlaying(false);
          }
          if (status.error) {
            console.error('Playback error:', status.error);
            Alert.alert('שגיאה', 'שגיאה בהשמעת הניגון: ' + status.error);
          }
        }
      });

      setSound(newSound);
      setPlayingSongId(song.id);
      setIsPlaying(true);
      
      console.log('Audio loaded and playing');
    } catch (error) {
      console.error('Error playing song:', error);
      let errorMessage = 'לא ניתן לנגן את הניגון.';
      if (error.message) {
        errorMessage += '\n' + error.message;
      }
      Alert.alert('שגיאה', errorMessage);
    }
  };

  const handleStopSong = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setPlayingSongId(null);
      setIsPlaying(false);
      setYoutubeId(null);
    } catch (error) {
      console.error('Error stopping song:', error);
    }
  };

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlayingSongId(null);
      setIsPlaying(false);
      // setYoutubeId(null); // Optional: keep player visible or close it
    }
  }, []);

  const handleRandomSong = useCallback(() => {
    if (songs.length === 0) {
      Alert.alert('אין ניגונים', 'אין ניגונים זמינים כרגע');
      return;
    }

    // Choose a random song
    const randomIndex = Math.floor(Math.random() * songs.length);
    const randomSong = songs[randomIndex];
    
    console.log('Playing random song:', randomSong.title);
    handlePlaySong(randomSong);
  }, [songs, handlePlaySong]);

  return (
    <View style={styles.container}>
      <AppHeader
        title={t('ניגונים')}
        subtitle="ניגוני הגאון הינוקא"
        onBackPress={() => navigation.goBack()}
        showBackButton={false}
        leftIcon="shuffle"
        onLeftIconPress={handleRandomSong}
        rightIcon={isAdmin ? 'add' : undefined}
        onRightIconPress={isAdmin ? () => navigation?.navigate('Admin') : undefined}
      />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-forward" size={24} color="#FFD700" />
      </TouchableOpacity>

      <LinearGradient colors={[BG, '#f5f5f5']} style={styles.gradientBg} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>טוען ניגונים...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
            {songs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={80} color="#FFD700" style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>אין ניגונים זמינים כרגע</Text>
              <Text style={styles.emptySubtext}>הניגונים יתווספו בקרוב</Text>
            </View>
          ) : (
            <>

              {/* YouTube Player Area */}
              {youtubeId && playingSongId && (
                <View style={styles.youtubeContainer}>
                  <YoutubePlayer
                    height={220}
                    play={true}
                    videoId={youtubeId}
                    onChangeState={onStateChange}
                  />
                  <TouchableOpacity style={styles.closeYoutubeBtn} onPress={handleStopSong}>
                    <Ionicons name="close-circle" size={30} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Currently Playing Audio Indicator (Only for Audio Files) */}
              {playingSongId && !youtubeId && (
                <View style={styles.nowPlayingBar}>
                  <View style={styles.nowPlayingContent}>
                    <Ionicons name="musical-note" size={20} color={PRIMARY_BLUE} />
                    <Text style={styles.nowPlayingText} numberOfLines={1}>
                      {songs.find(s => s.id === playingSongId)?.title || 'מנגן...'}
                    </Text>
                    {playbackStatus?.isLoaded && (
                      <Text style={styles.nowPlayingTime}>
                        {formatTime(playbackStatus.positionMillis)} / {formatTime(playbackStatus.durationMillis)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={handleStopSong}
                  >
                    <Ionicons name="stop" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Random Song Button */}
              {songs.length > 0 && (
                <TouchableOpacity
                  style={styles.randomButton}
                  onPress={handleRandomSong}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.randomButtonGradient}
                  >
                    <Ionicons name="shuffle" size={20} color="#fff" />
                    <Text style={styles.randomButtonText}>ניגון אקראי</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {songs.map((song, index) => (
                <TouchableOpacity
                  key={song.id}
                  style={[
                    styles.songCard,
                    playingSongId === song.id && styles.activeSongCard
                  ]}
                  onPress={() => handlePlaySong(song)}
                  activeOpacity={0.8}
                >
                  <View style={styles.songCardGradient}>
                    <View style={styles.songContent}>
                      {/* Song Image/Icon */}
                      <View style={styles.songImageContainer}>
                        {song.imageUrl ? (
                          <Image
                            source={{ uri: song.imageUrl }}
                            style={styles.songImage}
                          />
                        ) : (
                          <View style={styles.songIconContainer}>
                            <Ionicons name="musical-note" size={32} color={PRIMARY_BLUE} />
                          </View>
                        )}
                        {/* Overlay Icon if playing */}
                        {playingSongId === song.id && (
                          <View style={styles.playingOverlay}>
                            <Ionicons name={youtubeId ? "logo-youtube" : "musical-notes"} size={24} color="#fff" />
                          </View>
                        )}
                      </View>

                      {/* Song Info */}
                      <View style={styles.songInfo}>
                        <Text style={[
                          styles.songTitle,
                          playingSongId === song.id && styles.activeSongText
                        ]} numberOfLines={1}>
                          {song.title}
                        </Text>
                        {song.description && (
                          <Text style={styles.songDescription} numberOfLines={2}>
                            {song.description}
                          </Text>
                        )}
                        <View style={styles.songMeta}>
                          {song.duration && (
                            <View style={styles.metaItem}>
                              <Ionicons name="time-outline" size={14} color={PRIMARY_BLUE} />
                              <Text style={styles.metaText}>{song.duration}</Text>
                            </View>
                          )}
                          {song.youtubeId && (
                            <View style={styles.metaItem}>
                              <Ionicons name="logo-youtube" size={14} color="#FF0000" />
                              <Text style={[styles.metaText, { color: '#FF0000' }]}>וידאו</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Play/Pause Button */}
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => handlePlaySong(song)}
                      >
                        {playingSongId === song.id && isPlaying ? (
                          <Ionicons name="pause" size={24} color="#fff" />
                        ) : (
                          <Ionicons name="play" size={24} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Follow Us (moved below song list so הכותרת העליונה תהיה "ניגונים") */}
          <View style={styles.socialSection}>
            <Text style={styles.socialSectionTitle}>עקבו אחרינו</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.instagram.com/yanuka_rav_shlomoyehuda/')}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                <Text style={styles.socialLabel}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.tiktok.com/@the_yanuka_official')}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-tiktok" size={24} color="#000000" />
                <Text style={styles.socialLabel}>TikTok</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.youtube.com/channel/UC2G7zKbsBNpoVYbwb-NS56w')}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                <Text style={styles.socialLabel}>YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              "הניגון מעלה את הנפש ומקרב את הלב לקדושה"
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
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
  gradientBg: {
    display: 'none',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FFD700',
    fontFamily: 'Heebo_500Medium',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  socialSection: {
    marginBottom: 24,
  },
  socialSectionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'right',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  socialLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Heebo_500Medium',
  },
  songCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  activeSongCard: {
    borderColor: PRIMARY_BLUE,
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  songCardGradient: {
    borderRadius: 16,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  songImageContainer: {
    marginLeft: 15,
    position: 'relative',
  },
  songImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  songIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
  },
  songTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 5,
    textAlign: 'right',
  },
  activeSongText: {
    color: PRIMARY_BLUE,
  },
  songDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Poppins_400Regular',
  },
  songMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: '#FFD700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo_400Regular',
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: PRIMARY_BLUE,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Poppins_400Regular',
    opacity: 0.7,
  },
  nowPlayingBar: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nowPlayingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nowPlayingText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'right',
  },
  nowPlayingTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  closeYoutubeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  randomButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  randomButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  randomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
    letterSpacing: 0.5,
  },
});

// Helper function to format time
function formatTime(millis) {
  if (!millis) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
