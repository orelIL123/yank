import React from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const MENU_ITEMS = [
    { id: 'learningLibrary', label: 'ספריית לימוד', icon: 'library-outline', screen: 'LearningLibrary' },
    { id: 'lessons', label: 'שיעורים', icon: 'play-circle-outline', screen: 'Courses' },
    { id: 'music', label: 'ניגונים', icon: 'musical-notes-outline', screen: 'Music' },
    { id: 'newsletters', label: 'עלונים', icon: 'document-text-outline', screen: 'Newsletters' },
    { id: 'prayers', label: 'תפילות', icon: 'heart-outline', screen: 'Prayers' },
    { id: 'books', label: 'ספרים', icon: 'book-outline', screen: 'Books' },
    { id: 'parshiot', label: 'פרשת הנשיאים', icon: 'scroll-outline', screen: 'ParshiotHaNasiim' },
    { id: 'news', label: 'חדשות', icon: 'newspaper-outline', screen: 'News' },
    { id: 'about', label: 'אודות', icon: 'information-circle-outline', screen: 'About' },
    { id: 'contact', label: 'צור קשר', icon: 'mail-outline', screen: 'ContactRabbi' },
]

export default function MenuDrawer({ visible, onClose, navigation }) {
    const handleNavigate = (screen) => {
        onClose()
        setTimeout(() => {
            navigation?.navigate(screen)
        }, 300)
    }

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.overlay}
                onPress={onClose}
                activeOpacity={1}
            >
                <Pressable
                    style={styles.drawerContainer}
                    onPress={(e) => e.stopPropagation()}
                >
                    <SafeAreaView style={styles.drawer}>
                        <LinearGradient
                            colors={[BG, '#f5f5f5']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Header */}
                        <View style={styles.drawerHeader}>
                            <View style={{ width: 28 }} />
                            <Text style={styles.drawerTitle}>תפריט ראשי</Text>
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={28} color={PRIMARY_BLUE} />
                            </Pressable>
                        </View>

                        {/* Menu Items */}
                        <ScrollView
                            style={styles.menuScroll}
                            contentContainerStyle={styles.menuContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {MENU_ITEMS.map((item, index) => (
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
                                        <Text style={styles.menuItemLabel}>{item.label}</Text>
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
                                הגאון הינוקא שליט״א
                            </Text>
                            <Text style={styles.footerSubtext}>
                                "הודו לה׳ כי טוב"
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
        width: '80%',
        maxWidth: 360,
    },
    drawer: {
        flex: 1,
        backgroundColor: BG,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        overflow: 'hidden',
    },
    drawerHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(11,27,58,0.08)',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(30,58,138,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerTitle: {
        fontSize: 22,
        fontFamily: 'Heebo_700Bold',
        color: DEEP_BLUE,
    },
    menuScroll: {
        flex: 1,
    },
    menuContent: {
        padding: 16,
        gap: 8,
    },
    menuItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 8,
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
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(30,58,138,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemLabel: {
        fontSize: 17,
        fontFamily: 'Heebo_600SemiBold',
        color: DEEP_BLUE,
        textAlign: 'right',
    },
    menuItemArrow: {
        opacity: 0.5,
    },
    drawerFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(11,27,58,0.08)',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 16,
        fontFamily: 'Heebo_700Bold',
        color: PRIMARY_BLUE,
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#6b7280',
        fontStyle: 'italic',
    },
})
