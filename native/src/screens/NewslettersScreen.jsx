import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Alert, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { collection, getDocs, query, orderBy, where, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const LANGUAGES = [
  { key: 'hebrew', label: 'עברית', icon: 'language-outline' },
  { key: 'french', label: 'Français', icon: 'language-outline' },
  { key: 'russian', label: 'Русский', icon: 'language-outline' },
  { key: 'english', label: 'English', icon: 'language-outline' },
]

export default function NewslettersScreen({ navigation, userRole }) {
    const [newsletters, setNewsletters] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedLanguage, setSelectedLanguage] = useState('hebrew')
    const isAdmin = userRole === 'admin'

    useEffect(() => {
        fetchNewsletters()
    }, [selectedLanguage])

    const fetchNewsletters = async () => {
        try {
            const q = query(
                collection(db, 'newsletters'),
                where('language', '==', selectedLanguage),
                orderBy('publishDate', 'desc')
            )
            const querySnapshot = await getDocs(q)
            const newslettersData = []
            querySnapshot.forEach((doc) => {
                newslettersData.push({ id: doc.id, ...doc.data() })
            })
            setNewsletters(newslettersData)
        } catch (error) {
            console.error('Error fetching newsletters:', error)
            Alert.alert('שגיאה', 'לא ניתן לטעון את העלונים')
        } finally {
            setLoading(false)
        }
    }

    const handleNewsletterPress = (newsletter) => {
        if (newsletter.fileType === 'pdf') {
            navigation.navigate('PdfViewer', {
                pdfUrl: newsletter.fileUrl,
                title: newsletter.title
            })
        } else {
            // For images, navigate to a full-screen image viewer or PDF viewer
            navigation.navigate('PdfViewer', {
                pdfUrl: newsletter.fileUrl,
                title: newsletter.title,
                isImage: true
            })
        }
    }

    const handleDownload = async (newsletter) => {
        try {
            const fileUri = FileSystem.documentDirectory + `${newsletter.title}.${newsletter.fileType === 'pdf' ? 'pdf' : 'jpg'}`

            Alert.alert(
                'הורדה',
                'מוריד את הקובץ...',
                [{ text: 'אישור' }]
            )

            const downloadResult = await FileSystem.downloadAsync(
                newsletter.fileUrl,
                fileUri
            )

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadResult.uri)
            } else {
                Alert.alert('הצלחה', 'הקובץ הורד בהצלחה')
            }
        } catch (error) {
            console.error('Error downloading:', error)
            Alert.alert('שגיאה', 'לא ניתן להוריד את הקובץ')
        }
    }

    const handleShare = async (newsletter) => {
        try {
            await Share.share({
                message: `${newsletter.title}\n${newsletter.fileUrl}`,
                url: newsletter.fileUrl,
                title: newsletter.title
            })
        } catch (error) {
            console.error('Error sharing:', error)
        }
    }

    const handleDeleteNewsletter = (newsletter) => {
        Alert.alert(
            'מחיקת עלון',
            `האם אתה בטוח שברצונך למחוק את העלון "${newsletter.title}"?`,
            [
                {
                    text: 'ביטול',
                    style: 'cancel'
                },
                {
                    text: 'מחק',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'newsletters', newsletter.id))
                            Alert.alert('הצלחה', 'העלון נמחק בהצלחה')
                            fetchNewsletters()
                        } catch (error) {
                            console.error('Error deleting newsletter:', error)
                            Alert.alert('שגיאה', 'לא ניתן למחוק את העלון')
                        }
                    }
                }
            ]
        )
    }

    const renderNewsletter = ({ item }) => (
        <Pressable
            style={styles.newsletterCard}
            onPress={() => handleNewsletterPress(item)}
        >
            <View style={styles.newsletterImageContainer}>
                {item.thumbnailUrl || item.fileType === 'image' ? (
                    <Image
                        source={{ uri: item.thumbnailUrl || item.fileUrl }}
                        style={styles.newsletterImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.pdfPlaceholder}>
                        <Ionicons name="document-text" size={60} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                    </View>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.imageGradient}
                />
                <View style={styles.newsletterBadge}>
                    <Ionicons
                        name={item.fileType === 'pdf' ? 'document-text' : 'image'}
                        size={16}
                        color="#fff"
                    />
                    <Text style={styles.badgeText}>
                        {item.fileType === 'pdf' ? 'PDF' : 'תמונה'}
                    </Text>
                </View>
            </View>

            <View style={styles.newsletterContent}>
                <Text style={styles.newsletterTitle} numberOfLines={2}>{item.title}</Text>
                {item.description && (
                    <Text style={styles.newsletterDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                {item.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                )}

                <View style={styles.actionButtons}>
                    <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                            e.stopPropagation()
                            handleDownload(item)
                        }}
                    >
                        <Ionicons name="download-outline" size={20} color={PRIMARY_BLUE} />
                        <Text style={styles.actionButtonText}>הורדה</Text>
                    </Pressable>

                    <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                            e.stopPropagation()
                            handleShare(item)
                        }}
                    >
                        <Ionicons name="share-outline" size={20} color={PRIMARY_BLUE} />
                        <Text style={styles.actionButtonText}>שיתוף</Text>
                    </Pressable>

                    {isAdmin && (
                        <Pressable
                            style={[styles.actionButton, { borderTopWidth: 1, borderTopColor: 'rgba(239,68,68,0.2)', paddingTop: 8, marginTop: 4 }]}
                            onPress={(e) => {
                                e.stopPropagation()
                                handleDeleteNewsletter(item)
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>מחק</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </Pressable>
    )

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />

            <AppHeader
                title={t('עלונים')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                rightIcon={isAdmin ? 'add' : undefined}
                onRightIconPress={isAdmin ? () => navigation.navigate('AddNewsletter') : undefined}
            />

            {/* Language selector */}
            <View style={styles.languageSelector}>
                {LANGUAGES.map((lang) => (
                    <Pressable
                        key={lang.key}
                        style={[
                            styles.languageButton,
                            selectedLanguage === lang.key && styles.languageButtonActive
                        ]}
                        onPress={() => {
                            setSelectedLanguage(lang.key)
                            setLoading(true)
                        }}
                        accessibilityRole="button"
                    >
                        <Ionicons
                            name={lang.icon}
                            size={18}
                            color={selectedLanguage === lang.key ? '#fff' : PRIMARY_BLUE}
                        />
                        <Text style={[
                            styles.languageButtonText,
                            selectedLanguage === lang.key && styles.languageButtonTextActive
                        ]}>
                            {lang.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                    <Text style={styles.loadingText}>טוען עלונים...</Text>
                </View>
            ) : (
                <FlatList
                    data={newsletters}
                    renderItem={renderNewsletter}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={80} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                            <Text style={styles.emptyText}>אין עלונים זמינים</Text>
                            <Text style={styles.emptySubtext}>העלונים יתווספו בקרוב</Text>
                        </View>
                    }
                />
            )}
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
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(11,27,58,0.05)',
        backgroundColor: BG,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(30,58,138,0.05)',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        color: PRIMARY_BLUE,
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
    listContent: {
        padding: 12,
    },
    row: {
        justifyContent: 'space-between',
    },
    newsletterCard: {
        flex: 1,
        maxWidth: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(11,27,58,0.05)',
        overflow: 'hidden',
    },
    newsletterImageContainer: {
        width: '100%',
        height: 180,
        backgroundColor: '#f5f5f5',
        position: 'relative',
    },
    newsletterImage: {
        width: '100%',
        height: '100%',
    },
    pdfPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    newsletterBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30,58,138,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
    },
    newsletterContent: {
        padding: 12,
    },
    newsletterTitle: {
        fontSize: 15,
        fontFamily: 'Heebo_700Bold',
        color: DEEP_BLUE,
        textAlign: 'right',
        marginBottom: 6,
    },
    newsletterDescription: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#6b7280',
        textAlign: 'right',
        marginBottom: 8,
    },
    categoryBadge: {
        alignSelf: 'flex-end',
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
        color: PRIMARY_BLUE,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: 'rgba(11,27,58,0.05)',
        paddingTop: 8,
        marginTop: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
    },
    actionButtonText: {
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
        color: PRIMARY_BLUE,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
        color: DEEP_BLUE,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'Poppins_400Regular',
    },
    languageSelector: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexWrap: 'wrap',
        backgroundColor: BG,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(11,27,58,0.05)',
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(30,58,138,0.1)',
        borderWidth: 1,
        borderColor: PRIMARY_BLUE,
    },
    languageButtonActive: {
        backgroundColor: PRIMARY_BLUE,
        borderColor: PRIMARY_BLUE,
    },
    languageButtonText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        color: PRIMARY_BLUE,
    },
    languageButtonTextActive: {
        color: '#fff',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: PRIMARY_BLUE,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: PRIMARY_BLUE,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
})
