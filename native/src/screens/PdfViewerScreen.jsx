import React from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Linking, Alert, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import { WebView } from 'react-native-webview'

// react-native-pdf is not available in Expo Go, so we'll use WebView as fallback
// In dev builds, you can use react-native-pdf if needed
let Pdf = null
try {
  // Only try to require if we're not in Expo Go
  if (typeof require !== 'undefined') {
    const pdfModule = require('react-native-pdf')
    Pdf = pdfModule?.default || pdfModule
  }
} catch (e) {
  // Module not available (Expo Go), will use WebView
  console.log('react-native-pdf not available, using WebView fallback')
}

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const { width, height } = Dimensions.get('window')

export default function PdfViewerScreen({ route, navigation }) {
  const { pdf, title } = route.params || {}
  const [pdfUri, setPdfUri] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [pageCount, setPageCount] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(0)
  const [downloadProgress, setDownloadProgress] = React.useState(0)
  const pdfRef = React.useRef(null)

  React.useEffect(() => {
    const loadPdf = async () => {
      try {
        console.log('Loading PDF:', pdf)
        if (pdf) {
          let uri = null
          
          // Check if pdf is a URL string
          if (typeof pdf === 'string') {
            if (pdf.startsWith('http')) {
              uri = pdf
            } else if (pdf.startsWith('file://') || pdf.startsWith('content://')) {
              // Local file
              uri = pdf
              setPdfUri(uri)
              setLoading(false)
              return
            }
          } 
          // If it's an object with uri property (from Firestore)
          else if (pdf.uri) {
            if (pdf.uri.startsWith('http')) {
              uri = pdf.uri
            } else if (pdf.uri.startsWith('file://') || pdf.uri.startsWith('content://')) {
              // Local file
              uri = pdf.uri
              setPdfUri(uri)
              setLoading(false)
              return
            }
          }
          
          if (uri && uri.startsWith('http')) {
            // Download PDF to local file system first for better compatibility
            try {
              console.log('Downloading PDF from:', uri)
              const filename = uri.split('/').pop() || `prayer_${Date.now()}.pdf`
              const localUri = `${FileSystem.cacheDirectory}${filename}`
              
              // Check if file already exists in cache
              const fileInfo = await FileSystem.getInfoAsync(localUri)
              if (fileInfo.exists) {
                console.log('Using cached PDF:', localUri)
                setPdfUri(localUri)
                setLoading(false)
                return
              }
              
              // Download the file
              const downloadResult = await FileSystem.downloadAsync(uri, localUri, {
                headers: {
                  'Accept': 'application/pdf',
                },
              })
              
              if (downloadResult.status === 200) {
                console.log('PDF downloaded successfully:', localUri)
                setPdfUri(localUri)
                setLoading(false)
              } else {
                console.error('Download failed with status:', downloadResult.status)
                // Fallback to direct URL
                setPdfUri(uri)
                setLoading(false)
              }
            } catch (downloadError) {
              console.error('Error downloading PDF, using direct URL:', downloadError)
              // Fallback to direct URL if download fails
              setPdfUri(uri)
              setLoading(false)
            }
          } else {
            console.error('PDF is not a valid URL:', pdf)
            setError(true)
            setLoading(false)
          }
        } else {
          setError(true)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading PDF:', error)
        setError(true)
        setLoading(false)
      }
    }
    loadPdf()
  }, [pdf])

  const handleOpenInBrowser = async () => {
    if (pdfUri && pdfUri.startsWith('http')) {
      try {
        const canOpen = await Linking.canOpenURL(pdfUri)
        if (canOpen) {
          await Linking.openURL(pdfUri)
        } else {
          Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור')
        }
      } catch (error) {
        console.error('Error opening URL:', error)
        Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור')
      }
    }
  }

  const handleShare = async () => {
    if (pdfUri) {
      try {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: title || 'שתף PDF'
        })
      } catch (error) {
        console.error('Error sharing PDF:', error)
        Alert.alert('שגיאה', 'לא ניתן לשתף את הקובץ')
      }
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
          </Pressable>
          <Text style={styles.headerTitle}>{title || 'תפילה'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>
            {downloadProgress > 0 ? `מוריד PDF... ${Math.round(downloadProgress)}%` : 'טוען PDF...'}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !pdfUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
          </Pressable>
          <Text style={styles.headerTitle}>{title || 'תפילה'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
          <Text style={styles.errorText}>לא ניתן לטעון את הקובץ</Text>
          {pdfUri && pdfUri.startsWith('http') && (
            <Pressable
              style={styles.openBrowserButton}
              onPress={handleOpenInBrowser}
            >
              <Ionicons name="open-outline" size={20} color="#fff" />
              <Text style={styles.openBrowserButtonText}>פתח בדפדפן</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    )
  }

  // Display PDF in-app using react-native-pdf
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'תפילה'}</Text>
        <Pressable
          style={styles.shareBtn}
          onPress={handleShare}
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={20} color={PRIMARY_BLUE} />
        </Pressable>
      </View>
      
      {pageCount > 0 && (
        <View style={styles.pageInfo}>
          <Text style={styles.pageText}>
            עמוד {currentPage + 1} מתוך {pageCount}
          </Text>
        </View>
      )}

      <View style={styles.pdfContainer}>
        {Pdf ? (
          // Use react-native-pdf if available (dev builds)
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfUri, cache: true }}
            onLoadComplete={(numberOfPages) => {
              console.log(`PDF loaded: ${numberOfPages} pages`)
              setPageCount(numberOfPages)
              setLoading(false)
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Page changed: ${page} of ${numberOfPages}`)
              setCurrentPage(page - 1)
            }}
            onError={(error) => {
              console.error('PDF error:', error)
              setError(true)
              setLoading(false)
            }}
            onLoadProgress={(percent) => {
              if (percent === 1) {
                setLoading(false)
              }
            }}
            style={styles.pdf}
            enablePaging={true}
            horizontal={false}
            spacing={10}
            fitPolicy={0}
          />
        ) : (
          // Fallback to WebView for Expo Go
          <WebView
            source={{ uri: pdfUri }}
            style={styles.pdf}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent
              console.error('WebView error:', nativeEvent)
              setError(true)
              setLoading(false)
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                <Text style={styles.loadingText}>טוען PDF...</Text>
              </View>
            )}
          />
        )}
      </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.1)',
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
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  pageInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(30,58,138,0.08)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  pageText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
    textAlign: 'center',
  },
  openBrowserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minWidth: 200,
  },
  openBrowserButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
})
