import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, Linking, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import db from '../services/database'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function BooksScreen({ navigation }) {
    console.log('📕 BooksScreen RENDERED')
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [imageErrors, setImageErrors] = useState(new Set())

    useEffect(() => {
        fetchBooks()
    }, [])

    const fetchBooks = async () => {
        try {
            const booksData = await db.getCollection('books', {
                orderBy: { field: 'createdAt', direction: 'desc' }
            })

            booksData.forEach((book) => {
                console.log('Book loaded:', {
                    id: book.id,
                    title: book.title,
                    imageUrl: book.imageUrl,
                    hasImageUrl: !!book.imageUrl
                });
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
                        onError={(error) => {
                            console.error('Error loading book image:', {
                                bookId: item.id,
                                bookTitle: item.title,
                                imageUrl: item.imageUrl,
                                error: error.nativeEvent?.error || error
                            });
                            handleImageError(item.id);
                        }}
                        onLoad={() => {
                            console.log('✅ Book image loaded successfully:', {
                                bookId: item.id,
                                bookTitle: item.title,
                                imageUrl: item.imageUrl
                            });
                        }}
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

                <Pressable
                    style={styles.buyButton}
                    onPress={() => handleBuyBook(item.link)}
                >
                    <Text style={styles.buyButtonText}>לרכישה</Text>
                    <Ionicons name="cart-outline" size={16} color="#fff" />
                </Pressable>
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
})
