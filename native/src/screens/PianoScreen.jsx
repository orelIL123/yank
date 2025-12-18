import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';

const PRIMARY_BLUE = '#1e3a8a';
const DEEP_BLUE = '#0b1b3a';

const PIANO_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    let audioContext = null;
    let isInitialized = false;
    
    function initAudio() {
      if (isInitialized) return;
      
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        isInitialized = true;
        
        // Resume audio context on first touch
        document.addEventListener('touchstart', function resumeAudio() {
          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
          }
          document.removeEventListener('touchstart', resumeAudio);
        });
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }
      } catch (e) {
        console.error('Audio initialization error:', e);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
        }
      }
    }
    
    function playPianoNote(frequency) {
      if (!isInitialized || !audioContext) {
        initAudio();
        setTimeout(() => playPianoNote(frequency), 100);
        return;
      }
      
      try {
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            playNote(frequency);
          });
        } else {
          playNote(frequency);
        }
      } catch (e) {
        console.error('Play error:', e);
      }
    }
    
    function playNote(frequency) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1.5);
    }
    
    // Initialize on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAudio);
    } else {
      initAudio();
    }
    
    // Expose function globally
    window.playPianoNote = playPianoNote;
    
    // Message handler from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'play' && data.frequency) {
          playPianoNote(data.frequency);
        } else if (data.type === 'init') {
          initAudio();
        }
      } catch (e) {
        console.error('Message error:', e);
      }
    });
    
    // Also listen to ReactNativeWebView messages
    document.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'play' && data.frequency) {
          playPianoNote(data.frequency);
        } else if (data.type === 'init') {
          initAudio();
        }
      } catch (e) {
        // Ignore
      }
    });
  </script>
</body>
</html>
`;

export default function PianoScreen({ navigation }) {
  const [activeKey, setActiveKey] = useState(null);
  const [audioReady, setAudioReady] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const webViewRef = useRef(null);

  useEffect(() => {
    // Lock to landscape orientation and force rotation
    const lockOrientation = async () => {
      try {
        // First, get current orientation
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        console.log('Current orientation:', currentOrientation);
        
        // Check if already in landscape
        const isLandscape = 
          currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
        
        if (!isLandscape) {
          // Force rotation to landscape by unlocking first, then locking
          await ScreenOrientation.unlockAsync();
          // Small delay to allow unlock to complete
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Lock to landscape (allows both left and right landscape)
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        
        // Update dimensions after orientation change
        setTimeout(() => {
          const newDims = Dimensions.get('window');
          setDimensions(newDims);
          console.log('Dimensions after lock:', newDims);
        }, 300);
      } catch (error) {
        console.log('Orientation lock error:', error);
        // Retry after a short delay
        setTimeout(async () => {
          try {
            await ScreenOrientation.unlockAsync();
            await new Promise(resolve => setTimeout(resolve, 100));
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setTimeout(() => {
              setDimensions(Dimensions.get('window'));
            }, 300);
          } catch (retryError) {
            console.error('Retry orientation lock error:', retryError);
          }
        }, 500);
      }
    };

    lockOrientation();

    // Handle dimension changes (for orientation changes)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    // Initialize audio after a short delay
    const timer = setTimeout(() => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'init' }));
      }
    }, 500);

    // Cleanup: unlock orientation when leaving screen
    return () => {
      clearTimeout(timer);
      subscription?.remove();
      ScreenOrientation.unlockAsync().catch(console.error);
    };
  }, []);

  const playNote = (note, frequency) => {
    // Visual feedback
    setActiveKey(note);
    
    // Haptic feedback for mobile
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
    
    // Play sound via WebView
    if (webViewRef.current && audioReady) {
      try {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'play',
          frequency: frequency
        }));
      } catch (e) {
        console.error('Error sending message to WebView:', e);
      }
    }
    
    setTimeout(() => setActiveKey(null), 200);
  };

  const handleKeyPress = (note, frequency) => {
    playNote(note, frequency);
  };

  // More keys for landscape mode - full octave and more
  const whiteKeys = [
    { note: 'C', freq: 261.63 },
    { note: 'D', freq: 293.66 },
    { note: 'E', freq: 329.63 },
    { note: 'F', freq: 349.23 },
    { note: 'G', freq: 392.00 },
    { note: 'A', freq: 440.00 },
    { note: 'B', freq: 493.88 },
    { note: 'C2', freq: 523.25 },
    { note: 'D2', freq: 587.33 },
    { note: 'E2', freq: 659.25 },
    { note: 'F2', freq: 698.46 },
    { note: 'G2', freq: 783.99 },
    { note: 'A2', freq: 880.00 },
    { note: 'B2', freq: 987.77 },
  ];

  const blackKeys = [
    { note: 'C#', freq: 277.18, position: 0 },
    { note: 'D#', freq: 311.13, position: 1 },
    { note: 'F#', freq: 369.99, position: 3 },
    { note: 'G#', freq: 415.30, position: 4 },
    { note: 'A#', freq: 466.16, position: 5 },
    { note: 'C#2', freq: 554.37, position: 7 },
    { note: 'D#2', freq: 622.25, position: 8 },
    { note: 'F#2', freq: 739.99, position: 10 },
    { note: 'G#2', freq: 830.61, position: 11 },
    { note: 'A#2', freq: 932.33, position: 12 },
  ];

  // Calculate dimensions for landscape mode
  // In landscape, width is the longer dimension
  const isLandscape = dimensions.width > dimensions.height;
  const screenWidth = isLandscape ? dimensions.width : dimensions.height;
  const screenHeight = isLandscape ? dimensions.height : dimensions.width;
  const whiteKeyWidth = Math.max((screenWidth - 80) / whiteKeys.length, 30);
  const blackKeyWidth = whiteKeyWidth * 0.6;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={StyleSheet.absoluteFill} />
      
      {/* Hidden WebView for Audio */}
      <WebView
        ref={webViewRef}
        source={{ html: PIANO_HTML }}
        style={styles.hiddenWebView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ready') {
              setAudioReady(true);
              console.log('Audio context ready');
            } else if (data.type === 'error') {
              console.error('Audio error:', data.message);
            }
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        onLoadEnd={() => {
          // Trigger initialization after load
          setTimeout(() => {
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({ type: 'init' }));
            }
          }, 200);
        }}
      />
      
      {/* Header - Compact for landscape */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>הפסנתר של הרב</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Piano Container - Expanded for landscape */}
      <View style={styles.pianoContainer}>
        <View style={styles.pianoKeys}>
          {/* White Keys */}
          <View style={styles.whiteKeysRow}>
            {whiteKeys.map((key) => (
              <TouchableOpacity
                key={key.note}
                style={[
                  styles.whiteKey,
                  {
                    width: whiteKeyWidth - 2,
                    backgroundColor: activeKey === key.note ? '#e0e0e0' : '#fff',
                    transform: [{ scale: activeKey === key.note ? 0.98 : 1 }],
                  },
                ]}
                onPressIn={() => handleKeyPress(key.note, key.freq)}
                activeOpacity={0.9}
              >
                <Text style={[
                  styles.keyLabel,
                  activeKey === key.note && styles.keyLabelActive
                ]}>
                  {key.note}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Black Keys */}
          <View style={styles.blackKeysRow}>
            {blackKeys.map((key) => (
              <TouchableOpacity
                key={key.note}
                style={[
                  styles.blackKey,
                  {
                    left: (key.position * whiteKeyWidth) + (whiteKeyWidth * 0.65),
                    width: blackKeyWidth,
                    backgroundColor: activeKey === key.note ? '#444' : '#000',
                    transform: [{ scale: activeKey === key.note ? 0.98 : 1 }],
                  },
                ]}
                onPressIn={() => handleKeyPress(key.note, key.freq)}
                activeOpacity={0.9}
              >
                <Text style={[
                  styles.blackKeyLabel,
                  activeKey === key.note && styles.blackKeyLabelActive
                ]}>
                  {key.note}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Instructions - Compact for landscape */}
      <View style={styles.instructions}>
        <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.6)" />
        <Text style={styles.instructionsText}>
          {audioReady ? 'לחץ על הקלידים כדי לנגן' : 'מאתחל אודיו...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  hiddenWebView: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  pianoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pianoKeys: {
    width: '100%',
    height: '100%',
    maxHeight: 400,
    minHeight: 200,
    position: 'relative',
  },
  whiteKeysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  whiteKey: {
    height: '100%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  keyLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  keyLabelActive: {
    color: PRIMARY_BLUE,
  },
  blackKeysRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  blackKey: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  blackKeyLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  blackKeyLabelActive: {
    color: '#ccc',
  },
  instructions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    height: 40,
  },
  instructionsText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
});
