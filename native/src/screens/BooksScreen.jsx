import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Linking, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import db from '../services/database'
import { canManageBooks } from '../utils/permissions'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function BooksScreen({ navigation, userRole, userPermissions }) {
    const canManage = canManageBooks(userRole, userPermissions)
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [imageErrors, setImageErrors] = useState(new Set())
    const [editBook, setEditBook] = useState(null)
    const [editForm, setEditForm] = useState({ title: '', note: '', price: '', link: '', imageUrl: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchBooks()
    }, [])

    const fetchBooks = async () => {
        try {
            const booksData = await db.getCollection('books', {
                orderBy: { field: 'createdAt', direction: 'desc' }
            })

            setBooks(booksData)
        } catch (error) {
            console.error('Error fetching books:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBuyBook = async (url) => {
        if (url) {
            try {
                const supported = await Linking.canOpenURL(url)
                if (supported) {
                    await Linking.openURL(url)
                } else {
                    Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור')
                }
            } catch (error) {
                console.error('Error opening URL:', error)
                Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור')
            }
        }
    }

    const handleImageError = (bookId) => {
        setImageErrors(prev => new Set(prev).add(bookId));
    }

    const handleDeleteBook = (item) => {
        Alert.alert(
            'מחיקת מוצר',
            `למחוק את "${item.title}"?`,
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'מחק',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await db.deleteDocument('books', item.id)
                            fetchBooks()
                        } catch (e) {
                            Alert.alert('שגיאה', 'לא ניתן למחוק')
                        }
                    },
                },
            ]
        )
    }

    const handleOpenEdit = (item) => {
        setEditBook(item)
        setEditForm({
            title: item.title || '',
            note: item.note || '',
            price: item.price || '',
            link: item.link || '',
            imageUrl: item.imageUrl || '',
        })
    }

    const handleSaveEdit = async () => {
        if (!editBook || !editForm.title.trim()) {
            Alert.alert('שגיאה', 'כותרת חובה')
            return
        }
        setSaving(true)
        try {
            await db.updateDocument('books', editBook.id, {
                title: editForm.title.trim(),
                note: editForm.note || '',
                price: editForm.price || '',
                link: editForm.link || '',
                imageUrl: editForm.imageUrl || '',
            })
            setEditBook(null)
            fetchBooks()
        } catch (e) {
            Alert.alert('שגיאה', 'לא ניתן לשמור שינויים')
        } finally {
            setSaving(false)
        }
    }

    const renderBook = ({ item }) => {
        const hasError = imageErrors.has(item.id);
        const hasImage = item.imageUrl && item.imageUrl.trim() !== '' && !hasError;
        
        return (
        <View style={styles.bookCard}>
            <View style={styles.bookImageContainer}>
                {hasImage ? (
                    <Image 
                        source={{ uri: item.imageUrl }} 
                        style={styles.bookImage} 
                        resizeMode="cover"
                        onError={() => handleImageError(item.id)}
                        onLoad={() => {}}
                    />
                ) : (
                    <View style={styles.bookPlaceholder}>
                        <Ionicons name="book-outline" size={40} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                    </View>
                )}
            </View>

            <View style={styles.bookContent}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                {item.note ? (
                    <Text style={styles.bookNote} numberOfLines={2}>{item.note}</Text>
                ) : null}
                <Text style={styles.bookPrice}>{item.price}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable
                        style={styles.buyButton}
                        onPress={() => handleBuyBook(item.link)}
                    >
                        <Text style={styles.buyButtonText}>לרכישה</Text>
                        <Ionicons name="cart-outline" size={16} color="#fff" />
                    </Pressable>
                    {canManage && (
                        <>
                            <Pressable onPress={() => handleOpenEdit(item)} style={styles.adminIconBtn}>
                                <Ionicons name="pencil" size={20} color={PRIMARY_BLUE} />
                            </Pressable>
                            <Pressable onPress={() => handleDeleteBook(item)} style={styles.adminIconBtn}>
                                <Ionicons name="trash-outline" size={20} color="#dc2626" />
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />

            <AppHeader
                title="חנות קודש"
                subtitle="ספרים ומוצרים"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                </View>
            ) : (
                <FlatList
                    data={books}
                    renderItem={renderBook}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>לא נמצאו ספרים</Text>
                        </View>
                    }
                />
            )}

            {/* Edit Book Modal (admin only) */}
            <Modal visible={!!editBook} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>עריכת מוצר</Text>
                            <Pressable onPress={() => setEditBook(null)}>
                                <Ionicons name="close" size={28} color={DEEP_BLUE} />
                            </Pressable>
                        </View>
                        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                            <Text style={styles.formLabel}>כותרת *</Text>
                            <TextInput
                                style={styles.formInput}
                                value={editForm.title}
                                onChangeText={(t) => setEditForm(f => ({ ...f, title: t }))}
                                placeholder="כותרת"
                                placeholderTextColor="#9ca3af"
                            />
                            <Text style={styles.formLabel}>הערה</Text>
                            <TextInput
                                style={[styles.formInput, styles.formTextArea]}
                                value={editForm.note}
                                onChangeText={(t) => setEditForm(f => ({ ...f, note: t }))}
                                placeholder="הערה"
                                placeholderTextColor="#9ca3af"
                                multiline
                            />
                            <Text style={styles.formLabel}>מחיר</Text>
                            <TextInput
                                style={styles.formInput}
                                value={editForm.price}
                                onChangeText={(t) => setEditForm(f => ({ ...f, price: t }))}
                                placeholder="מחיר"
                                placeholderTextColor="#9ca3af"
                            />
                            <Text style={styles.formLabel}>קישור לרכישה</Text>
                            <TextInput
                                style={styles.formInput}
                                value={editForm.link}
                                onChangeText={(t) => setEditForm(f => ({ ...f, link: t }))}
                                placeholder="https://..."
                                placeholderTextColor="#9ca3af"
                                autoCapitalize="none"
                            />
                            <Text style={styles.formLabel}>כתובת תמונה</Text>
                            <TextInput
                                style={styles.formInput}
                                value={editForm.imageUrl}
                                onChangeText={(t) => setEditForm(f => ({ ...f, imageUrl: t }))}
                                placeholder="https://..."
                                placeholderTextColor="#9ca3af"
                                autoCapitalize="none"
                            />
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <Pressable style={styles.cancelButton} onPress={() => setEditBook(null)}>
                                <Text style={styles.cancelButtonText}>ביטול</Text>
                            </Pressable>
                            <Pressable style={styles.saveButton} onPress={handleSaveEdit} disabled={saving}>
                                <Text style={styles.saveButtonText}>{saving ? 'שומר...' : 'שמור'}</Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    bookCard: {
        flexDirection: 'row-reverse', // RTL layout
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(11,27,58,0.05)',
    },
    bookImageContainer: {
        width: 100,
        height: 140,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        marginLeft: 16,
    },
    bookImage: {
        width: '100%',
        height: '100%',
    },
    bookPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookContent: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'flex-end', // Align text to right
    },
    bookTitle: {
        fontSize: 18,
        fontFamily: 'Heebo_700Bold',
        color: DEEP_BLUE,
        textAlign: 'right',
        marginBottom: 4,
    },
    bookNote: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#6b7280',
        textAlign: 'right',
        marginBottom: 8,
    },
    bookPrice: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: PRIMARY_BLUE,
        marginBottom: 12,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_BLUE,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    buyButtonText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
        color: '#6b7280',
    },
    adminIconBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(30,58,138,0.08)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Heebo_700Bold',
        color: DEEP_BLUE,
    },
    modalBody: {
        padding: 16,
        maxHeight: 400,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    formLabel: {
        fontSize: 14,
        fontFamily: 'Heebo_500Medium',
        color: DEEP_BLUE,
        marginBottom: 4,
        marginTop: 12,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: DEEP_BLUE,
    },
    formTextArea: {
        minHeight: 60,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6b7280',
    },
    saveButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
        backgroundColor: PRIMARY_BLUE,
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'Heebo_600SemiBold',
    },
})
