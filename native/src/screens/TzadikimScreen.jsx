import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Dimensions,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import db from '../services/database';

const PRIMARY_BLUE = '#1e3a8a';
const BG = '#FFFFFF';
const DEEP_BLUE = '#0b1b3a';
const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2; // 2 columns with padding

// Component for rendering tzadik card with image error handling
const TzadikCard = ({ item, navigation }) => {
  const [imageError, setImageError] = useState(false);
  
  const handlePress = () => {
    console.log('🔵 Tzadik card pressed:', item.name);
    console.log('🔵 Navigation object exists:', !!navigation);
    try {
      navigation.navigate('TzadikDetail', { tzadik: item });
      console.log('🔵 Navigation successful');
    } catch (error) {
      console.error('🔴 Navigation error:', error);
      Alert.alert('שגיאה', 'לא ניתן לפתוח את פרטי הצדיק');
    }
  };
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }
      ]}
      onPress={handlePress}
    >
      <View style={styles.cardImageContainer} pointerEvents="none">
        {item.imageUrl && !imageError ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={(error) => {
              console.error('Error loading image:', item.imageUrl, error);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', item.imageUrl);
            }}
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Ionicons name="person" size={40} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
          </View>
        )}
      </View>
      <View style={styles.cardContent} pointerEvents="none">
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.title && (
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default function TzadikimScreen({ navigation, userRole }) {
  const isAdmin = userRole === 'admin';
  const [tzadikim, setTzadikim] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTzadikim, setFilteredTzadikim] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadTzadikim();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTzadikim(tzadikim);
    } else {
      const filtered = tzadikim.filter(tzadik => 
        tzadik.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tzadik.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tzadik.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTzadikim(filtered);
    }
  }, [searchQuery, tzadikim]);

  const loadTzadikim = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Use database service with pagination
      const options = {
        orderBy: { field: 'name', direction: 'asc' },
        limit: 20
      };

      // For pagination, use offset-based approach
      if (loadMore && lastVisible) {
        options.startAfter = lastVisible; // Use stored offset
      }

      const tzadikimData = await db.getCollectionPaginated('tzadikim', options);
      
      console.log('Tzadikim loaded:', tzadikimData.length);
      tzadikimData.forEach(tzadik => {
        console.log('Tzadik loaded:', {
          id: tzadik.id,
          name: tzadik.name,
          imageUrl: tzadik.imageUrl,
          hasImageUrl: !!tzadik.imageUrl
        });
      });

      if (loadMore) {
        setTzadikim(prev => [...prev, ...tzadikimData]);
      } else {
        setTzadikim(tzadikimData);
      }

      // Update lastVisible for pagination (store current count as offset)
      if (tzadikimData.length > 0) {
        setLastVisible(loadMore ? (tzadikim.length + tzadikimData.length) : tzadikimData.length);
      } else {
        setLastVisible(null); // No more data
      }

    } catch (error) {
      console.error('Error loading tzadikim:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את רשימת הצדיקים');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && lastVisible) {
      loadTzadikim(true);
    }
  };

  const renderTzadikCard = ({ item }) => (
    <TzadikCard item={item} navigation={navigation} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ספר תולדות אדם</Text>
        {isAdmin ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Admin', { initialTab: 'tzadikim' })}
          >
            <Ionicons name="add" size={28} color={PRIMARY_BLUE} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש צדיק או רב..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען צדיקים...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTzadikim}
          renderItem={renderTzadikCard}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={80} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'לא נמצאו תוצאות' : 'אין צדיקים זמינים כרגע'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'נסה לחפש בשם אחר' : 'הצדיקים יתווספו בקרוב'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={PRIMARY_BLUE} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
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
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,58,138,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
  },
  clearButton: {
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    width: CARD_SIZE,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  cardImageContainer: {
    width: '100%',
    height: CARD_SIZE * 0.7,
    backgroundColor: '#f5f5f5',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,58,138,0.05)',
  },
  cardContent: {
    padding: 12,
    alignItems: 'flex-end',
  },
  cardName: {
    fontSize: 16,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Poppins_400Regular',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

