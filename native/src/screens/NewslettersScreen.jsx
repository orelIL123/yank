import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Alert, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'
import db from '../services/database'
import { canManageNewsletters } from '../utils/permissions'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const LANGUAGES = [
  { key: 'hebrew', label: 'עברית', icon: 'language-outline' },
  { key: 'french', label: 'Français', icon: 'language-outline' },
  { key: 'russian', label: 'Русский', icon: 'language-outline' },
  { key: 'english', label: 'English', icon: 'language-outline' },
]

const FILTER_OPTIONS = [
  { key: 'all', label: 'הכל' },
  { key: 'parsha', label: 'פרשת השבוע' },
  { key: 'holiday', label: 'חגים' },
]

export default function NewslettersScreen({ navigation, userRole, userPermissions }) {
    const [newsletters, setNewsletters] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedLanguage, setSelectedLanguage] = useState('hebrew')
    const [filterType, setFilterType] = useState('all')
    const canManage = canManageNewsletters(userRole, userPermissions)

    useEffect(() => {
        fetchNewsletters()
    }, [selectedLanguage, filterType])

    // Refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchNewsletters()
        }, [selectedLanguage, filterType])
    )

    const fetchNewsletters = async () => {
        try {
            setLoading(true)
            // Fetch all newsletters and filter by language (handles null language as "hebrew" for backward compatibility)
            const allNewsletters = await db.getCollection('newsletters', {
                orderBy: { field: 'publishDate', direction: 'desc' }
            })
            
            // Filter by language, treating null/undefined as 'hebrew' for backward compatibility
            let filtered = allNewsletters.filter(nl => {
                const lang = nl.language || 'hebrew'
                return lang === selectedLanguage
            })

            // Filter by parsha/holiday when filter is active
            if (filterType === 'parsha') {
                filtered = filtered.filter(nl => nl.parsha || (nl.category && /פרש|parsha/i.test(nl.category)))
            } else if (filterType === 'holiday') {
                filtered = filtered.filter(nl => nl.holiday || (nl.category && /חג|holiday|chag/i.test(nl.category)))
            }
            
            console.log(`Loaded ${filtered.length} newsletters for language: ${selectedLanguage}, filter: ${filterType}`)
            setNewsletters(filtered)
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
            if (!newsletter.fileUrl) {
                Alert.alert('שגיאה', 'אין קישור לקובץ')
                return
            }

            // Clean filename - remove special characters
            const cleanTitle = newsletter.title.replace(/[^a-zA-Z0-9\u0590-\u05FF\s]/g, '_').trim()
            const extension = newsletter.fileType === 'pdf' ? 'pdf' : (newsletter.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)?.[1] || 'jpg')
            const fileName = `${cleanTitle}.${extension}`
            const fileUri = FileSystem.documentDirectory + fileName

            console.log('Downloading file:', newsletter.fileUrl, 'to:', fileUri)

            const downloadResult = await FileSystem.downloadAsync(
                newsletter.fileUrl,
                fileUri
            )

            console.log('Download completed:', downloadResult.uri)

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadResult.uri)
                Alert.alert('הצלחה', 'הקובץ הורד ומוכן לשיתוף')
            } else {
                Alert.alert('הצלחה', `הקובץ הורד בהצלחה ל: ${fileName}`)
            }
        } catch (error) {
            console.error('Error downloading:', error)
            Alert.alert('שגיאה', `לא ניתן להוריד את הקובץ: ${error.message || 'שגיאה לא ידועה'}`)
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
                            await db.deleteDocument('newsletters', newsletter.id)
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

    const handleEditNewsletter = (newsletter) => {
        navigation.navigate('AddNewsletter', { newsletter })
    }

    const renderHeroCard = (item) => (
        <Pressable
            style={styles.heroCard}
            onPress={() => handleNewsletterPress(item)}
            onLongPress={canManage ? () => handleEditNewsletter(item) : undefined}
        >
            <View style={styles.heroImageContainer} pointerEvents="box-none">
                <View style={styles.latestBadgeHero} pointerEvents="none">
                    <Text style={styles.latestBadgeText}>העלון השבועי</Text>
                </View>
                {item.thumbnailUrl || item.fileType === 'image' ? (
                    <Image
                        source={{ uri: item.thumbnailUrl || item.fileUrl }}
                        style={styles.heroImage}
                        resizeMode="cover"
                        pointerEvents="none"
                    />
                ) : (
                    <View style={styles.heroPdfPlaceholder} pointerEvents="none">
                        <Ionicons name="document-text" size={72} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                    </View>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.heroGradient}
                    pointerEvents="none"
                />
                <View style={styles.newsletterBadge} pointerEvents="none">
                    <Ionicons
                        name={item.fileType === 'pdf' ? 'document-text' : 'image'}
                        size={16}
                        color="#fff"
                    />
                    <Text style={styles.badgeText}>{item.fileType === 'pdf' ? 'PDF' : 'תמונה'}</Text>
                </View>
            </View>
            <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                {item.description && (
                    <Text style={styles.heroDescription} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={styles.heroActions}>
                    <Pressable style={styles.heroActionBtn} onPress={(e) => { e.stopPropagation(); handleDownload(item) }}>
                        <Ionicons name="download-outline" size={20} color={PRIMARY_BLUE} />
                        <Text style={styles.actionButtonText}>הורדה</Text>
                    </Pressable>
                    <Pressable style={styles.heroActionBtn} onPress={(e) => { e.stopPropagation(); handleShare(item) }}>
                        <Ionicons name="share-outline" size={20} color={PRIMARY_BLUE} />
                        <Text style={styles.actionButtonText}>שיתוף</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    )

    const renderNewsletter = ({ item }) => (
        <Pressable
            style={styles.newsletterCard}
            onPress={() => handleNewsletterPress(item)}
            onLongPress={canManage ? () => handleEditNewsletter(item) : undefined}
        >
            <View style={styles.newsletterImageContainer} pointerEvents="box-none">
                {item.thumbnailUrl || item.fileType === 'image' ? (
                    <Image
                        source={{ uri: item.thumbnailUrl || item.fileUrl }}
                        style={styles.newsletterImage}
                        resizeMode="cover"
                        pointerEvents="none"
                    />
                ) : (
                    <View style={styles.pdfPlaceholder} pointerEvents="none">
                        <Ionicons name="document-text" size={60} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                    </View>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.imageGradient}
                    pointerEvents="none"
                />
                <View style={styles.newsletterBadge} pointerEvents="none">
                    <Ionicons name={item.fileType === 'pdf' ? 'document-text' : 'image'} size={16} color="#fff" />
                    <Text style={styles.badgeText}>{item.fileType === 'pdf' ? 'PDF' : 'תמונה'}</Text>
                </View>
            </View>
            <View style={styles.newsletterContent}>
                <Text style={styles.newsletterTitle} numberOfLines={2}>{item.title}</Text>
                {item.description && (
                    <Text style={styles.newsletterDescription} numberOfLines={2}>{item.description}</Text>
                )}
                {item.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                )}
                <View style={styles.actionButtons}>
                    <View style={styles.actionButtonsRow}>
                        <Pressable style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleDownload(item) }}>
                            <Ionicons name="download-outline" size={18} color={PRIMARY_BLUE} />
                            <Text style={styles.actionButtonText}>הורדה</Text>
                        </Pressable>
                        <Pressable style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleShare(item) }}>
                            <Ionicons name="share-outline" size={18} color={PRIMARY_BLUE} />
                            <Text style={styles.actionButtonText}>שיתוף</Text>
                        </Pressable>
                    </View>
                    {canManage && (
                        <View style={[styles.actionButtonsRow, styles.adminButtonsRow]}>
                            <Pressable style={[styles.actionButton, styles.editButton]} onPress={(e) => { e.stopPropagation(); handleEditNewsletter(item) }}>
                                <Ionicons name="create-outline" size={18} color={PRIMARY_BLUE} />
                                <Text style={styles.actionButtonText}>ערוך</Text>
                            </Pressable>
                            <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={(e) => { e.stopPropagation(); handleDeleteNewsletter(item) }}>
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>מחק</Text>
                            </Pressable>
                        </View>
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
                rightIcon={canManage ? 'add' : undefined}
                onRightIconPress={canManage ? () => navigation.navigate('AddNewsletter') : undefined}
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

            {/* Filter: parsha / holidays */}
            <View style={styles.filterRow}>
                {FILTER_OPTIONS.map((opt) => (
                    <Pressable
                        key={opt.key}
                        style={[
                            styles.filterButton,
                            filterType === opt.key && styles.filterButtonActive
                        ]}
                        onPress={() => setFilterType(opt.key)}
                        accessibilityRole="button"
                    >
                        <Text style={[
                            styles.filterButtonText,
                            filterType === opt.key && styles.filterButtonTextActive
                        ]}>
                            {opt.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                    <Text style={styles.loadingText}>טוען עלונים...</Text>
                </View>
            ) : newsletters.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={80} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                    <Text style={styles.emptyText}>אין עלונים זמינים</Text>
                    <Text style={styles.emptySubtext}>העלונים יתווספו בקרוב</Text>
                </View>
            ) : (
                <FlatList
                    data={newsletters.slice(1)}
                    renderItem={renderNewsletter}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <>
                            {renderHeroCard(newsletters[0])}
                            <View style={styles.archiveSectionHeader}>
                                <Text style={styles.archiveSectionTitle}>עלונים נוספים</Text>
                            </View>
                        </>
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
        paddingTop: 8,
    },
    row: {
        justifyContent: 'space-between',
    },
    heroCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        borderWidth: 2,
        borderColor: PRIMARY_BLUE,
    },
    heroImageContainer: {
        width: '100%',
        height: 240,
        backgroundColor: '#f5f5f5',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroPdfPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    latestBadgeHero: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 2,
        backgroundColor: PRIMARY_BLUE,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    heroContent: {
        padding: 16,
    },
    heroTitle: {
        fontSize: 20,
        fontFamily: 'Heebo_700Bold',
        color: DEEP_BLUE,
        textAlign: 'right',
        marginBottom: 8,
    },
    heroDescription: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#6b7280',
        textAlign: 'right',
        marginBottom: 12,
    },
    heroActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    heroActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: 'rgba(30,58,138,0.1)',
    },
    archiveSectionHeader: {
        marginBottom: 12,
        marginTop: 4,
    },
    archiveSectionTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_700Bold',
        color: DEEP_BLUE,
        textAlign: 'right',
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
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(11,27,58,0.05)',
        paddingTop: 8,
        marginTop: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 8,
    },
    adminButtonsRow: {
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(11,27,58,0.08)',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(30,58,138,0.05)',
        flex: 1,
        justifyContent: 'center',
        minHeight: 40,
    },
    editButton: {
        backgroundColor: 'rgba(30,58,138,0.1)',
    },
    deleteButton: {
        backgroundColor: 'rgba(239,68,68,0.1)',
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
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexWrap: 'wrap',
        backgroundColor: BG,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(11,27,58,0.05)',
    },
    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(30,58,138,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(30,58,138,0.3)',
    },
    filterButtonActive: {
        backgroundColor: PRIMARY_BLUE,
        borderColor: PRIMARY_BLUE,
    },
    filterButtonText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        color: PRIMARY_BLUE,
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    newsletterCardLatest: {
        borderWidth: 2,
        borderColor: PRIMARY_BLUE,
        shadowOpacity: 0.15,
    },
    latestBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 2,
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    latestBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'Poppins_700Bold',
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
