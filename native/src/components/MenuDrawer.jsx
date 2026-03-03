import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { isAdmin } from '../utils/permissions'
import { getLocale, initLocale, setLocale, t } from '../utils/i18n'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const LANGUAGE_OPTIONS = [
    { key: 'he', label: 'עברית' },
    { key: 'en', label: 'אנגלית' },
    { key: 'fr', label: 'צרפתית' },
]

const MENU_ITEMS = [
    { id: 'learningLibrary', label: 'ספריית לימוד', icon: 'library-outline', screen: 'LearningLibrary' },
    { id: 'lessons', label: 'שיעורים', icon: 'play-circle-outline', screen: 'DailyLearning' },
    { id: 'music', label: 'ניגונים', icon: 'musical-notes-outline', screen: 'Music' },
    { id: 'newsletters', label: 'עלונים', icon: 'document-text-outline', screen: 'Newsletters' },
    { id: 'prayers', label: 'תפילות', icon: 'heart-outline', screen: 'Prayers' },
    { id: 'siddur', label: 'סידור', icon: 'book-outline', screen: 'Siddur' },
    { id: 'sefer-hamidot', label: 'ספר המידות', icon: 'flame-outline', screen: 'SeferHaMidot' },
    { id: 'books', label: 'ספרים', icon: 'book-outline', screen: 'Books' },
    // Ionicons doesn't include "scroll-outline" (caused runtime warning). Use a valid icon.
    { id: 'parshiot', label: 'פרשת הנשיאים', icon: 'document-text-outline', screen: 'ParshiotHaNasiim' },
    { id: 'tools', label: 'כלי עזר', icon: 'construct-outline', screen: 'Tools' },
    { id: 'news', label: 'תיעודים ועדכונים', icon: 'newspaper-outline', screen: 'News' },
    { id: 'about', label: 'אודות', icon: 'information-circle-outline', screen: 'About' },
    { id: 'contact', label: 'צור קשר', icon: 'mail-outline', screen: 'ContactRabbi' },
    // Admin panel (screen will guard access)
    { id: 'admin', label: 'פאנל אדמין', icon: 'lock-closed-outline', screen: 'Admin' },
]

export default function MenuDrawer({ visible, onClose, navigation, userRole }) {
    const insets = useSafeAreaInsets()
    const [currentLocale, setCurrentLocale] = useState(getLocale())

    const handleNavigate = (screen) => {
        onClose()
        setTimeout(() => {
            navigation?.navigate(screen)
        }, 300)
    }

    useEffect(() => {
        initLocale().then((locale) => {
            setCurrentLocale(locale)
        })
    }, [])

    const handleLanguageChange = async (locale) => {
        const next = await setLocale(locale)
        setCurrentLocale(next)
    }

    // Debug: Log userRole
    console.log('🔵 MenuDrawer - userRole:', userRole, 'isAdmin:', isAdmin(userRole))

    // Filter menu items based on user role
    const filteredMenuItems = MENU_ITEMS.filter(item => {
        // Show admin panel only to admins
        if (item.id === 'admin') {
            return isAdmin(userRole)
        }
        return true
    })

    // Don't render anything if not visible - prevents touch blocking
    if (!visible) return null

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.overlay}
                onPress={onClose}
                activeOpacity={1}
            >
                <Pressable
                    style={[
                        styles.drawerContainer,
                        {
                            paddingTop: 0,
                            paddingBottom: 0,
                            paddingRight: 0,
                            paddingLeft: 0,
                        },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <SafeAreaView style={[styles.drawer, { paddingTop: Math.max(insets.top, 4), paddingBottom: Math.max(insets.bottom, 4) }]} edges={['top', 'bottom']}>
                        <LinearGradient
                            colors={[BG, '#f5f5f5']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Header */}
                        <View style={styles.drawerHeader}>
                            <Pressable 
                                onPress={onClose} 
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={24} color={PRIMARY_BLUE} />
                            </Pressable>
                            <Text style={styles.drawerTitle}>{t('תפריט ראשי')}</Text>
                            <View style={{ width: 36 }} />
                        </View>

                        <View style={styles.languageBar}>
                            <Text style={styles.languageTitle}>{t('שפה')}</Text>
                            <View style={styles.languageButtonsRow}>
                                {LANGUAGE_OPTIONS.map((option) => (
                                    <Pressable
                                        key={option.key}
                                        onPress={() => handleLanguageChange(option.key)}
                                        style={[
                                            styles.languageButton,
                                            currentLocale === option.key && styles.languageButtonActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.languageButtonText,
                                                currentLocale === option.key && styles.languageButtonTextActive,
                                            ]}
                                        >
                                            {t(option.label)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Menu Items */}
                        <ScrollView
                            style={styles.menuScroll}
                            contentContainerStyle={styles.menuContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {filteredMenuItems.map((item) => (
                                <Pressable
                                    key={item.id}
                                    style={({ pressed }) => [
                                        styles.menuItem,
                                        pressed && styles.menuItemPressed
                                    ]}
                                    onPress={() => handleNavigate(item.screen)}
                                >
                                    <View style={styles.menuItemArrow}>
                                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                                    </View>
                                    <View style={styles.menuItemContent}>
                                        <Text style={styles.menuItemLabel}>{t(item.label)}</Text>
                                        <View style={styles.menuItemIcon}>
                                            <Ionicons name={item.icon} size={24} color={PRIMARY_BLUE} />
                                        </View>
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.drawerFooter}>
                            <Text style={styles.footerText}>
                                {t('הגאון הינוקא שליט״א')}
                            </Text>
                            <Text style={styles.footerSubtext}>
                                "{t('הודו לה׳ כי טוב')}"
                            </Text>
                        </View>
                    </SafeAreaView>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    drawerContainer: {
        height: '100%',
        width: '88%',
        maxWidth: 420,
    },
    drawer: {
        flex: 1,
        backgroundColor: BG,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
    },
    drawerHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(11,27,58,0.08)',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(30,58,138,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerTitle: {
        fontSize: 20,
        fontFamily: 'Heebo_700Bold',
        color: DEEP_BLUE,
        textAlign: 'center',
        flex: 1,
    },
    menuScroll: {
        flex: 1,
    },
    languageBar: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 8,
    },
    languageTitle: {
        fontSize: 13,
        fontFamily: 'Heebo_600SemiBold',
        color: '#475569',
        textAlign: 'right',
        marginBottom: 8,
    },
    languageButtonsRow: {
        flexDirection: 'row-reverse',
        gap: 8,
    },
    languageButton: {
        borderWidth: 1,
        borderColor: 'rgba(11,27,58,0.15)',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    languageButtonActive: {
        borderColor: PRIMARY_BLUE,
        backgroundColor: 'rgba(30,58,138,0.08)',
    },
    languageButtonText: {
        fontSize: 12,
        fontFamily: 'Heebo_500Medium',
        color: '#475569',
        textAlign: 'center',
    },
    languageButtonTextActive: {
        color: PRIMARY_BLUE,
        fontFamily: 'Heebo_700Bold',
    },
    menuContent: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        gap: 6,
    },
    menuItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 6,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(11,27,58,0.05)',
    },
    menuItemPressed: {
        backgroundColor: '#f0f9ff',
        transform: [{ scale: 0.98 }],
    },
    menuItemContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    menuItemIcon: {
        width: 44,
        height: 44,
        borderRadius: 11,
        backgroundColor: 'rgba(30,58,138,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemLabel: {
        fontSize: 16,
        fontFamily: 'Heebo_600SemiBold',
        color: DEEP_BLUE,
        textAlign: 'right',
        flexShrink: 1,
    },
    menuItemArrow: {
        opacity: 0.5,
    },
    drawerFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(11,27,58,0.08)',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 15,
        fontFamily: 'Heebo_700Bold',
        color: PRIMARY_BLUE,
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
        color: '#6b7280',
        fontStyle: 'italic',
    },
})
