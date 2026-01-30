import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PERMISSIONS, PERMISSION_LABELS } from '../utils/permissions';

export default function ManagePermissionsScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role !== 'admin'); // Don't show admins

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את רשימת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const togglePermission = async (permission) => {
    if (!selectedUser) return;

    try {
      const currentPermissions = selectedUser.permissions || [];
      const hasPermission = currentPermissions.includes(permission);

      const newPermissions = hasPermission
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission];

      // Update in Firestore
      await updateDoc(doc(db, 'users', selectedUser.id), {
        permissions: newPermissions
      });

      // Update local state
      setSelectedUser({ ...selectedUser, permissions: newPermissions });
      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? { ...u, permissions: newPermissions }
          : u
      ));

      console.log(`Updated permissions for ${selectedUser.name}:`, newPermissions);
    } catch (error) {
      console.error('Error updating permissions:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את ההרשאות');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }) => {
    const userPermissions = item.permissions || [];
    const permissionCount = userPermissions.length;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => openPermissionsModal(item)}
      >
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{item.name || 'ללא שם'}</Text>
            {permissionCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{permissionCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          {permissionCount > 0 && (
            <View style={styles.permissionsList}>
              {userPermissions.slice(0, 2).map(perm => (
                <Text key={perm} style={styles.permissionTag}>
                  {PERMISSION_LABELS[perm]}
                </Text>
              ))}
              {permissionCount > 2 && (
                <Text style={styles.permissionTag}>+{permissionCount - 2}</Text>
              )}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFD700" />
      </TouchableOpacity>
    );
  };

  const renderPermissionItem = (permission, label) => {
    if (!selectedUser) return null;
    
    const userPermissions = selectedUser.permissions || [];
    const isEnabled = userPermissions.includes(permission);

    return (
      <TouchableOpacity
        key={permission}
        style={styles.permissionItem}
        onPress={() => togglePermission(permission)}
      >
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionLabel}>{label}</Text>
        </View>
        <View style={[styles.switch, isEnabled && styles.switchActive]}>
          {isEnabled && <View style={styles.switchThumb} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ניהול הרשאות</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ניהול הרשאות</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש משתמש..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>לא נמצאו משתמשים</Text>
          </View>
        }
      />

      {/* Permissions Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedUser?.name || 'ללא שם'}
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>

            <ScrollView style={styles.permissionsScrollView}>
              <View style={styles.permissionsContainer}>
                <Text style={styles.sectionTitle}>הרשאות זמינות:</Text>

                {/* Content Management Permissions */}
                {renderPermissionItem(PERMISSIONS.PRAYERS, PERMISSION_LABELS[PERMISSIONS.PRAYERS])}
                {renderPermissionItem(PERMISSIONS.VIDEOS, PERMISSION_LABELS[PERMISSIONS.VIDEOS])}
                {renderPermissionItem(PERMISSIONS.MUSIC, PERMISSION_LABELS[PERMISSIONS.MUSIC])}
                {renderPermissionItem(PERMISSIONS.BOOKS, PERMISSION_LABELS[PERMISSIONS.BOOKS])}
                {renderPermissionItem(PERMISSIONS.LEARNING, PERMISSION_LABELS[PERMISSIONS.LEARNING])}
                {renderPermissionItem(PERMISSIONS.NEWS, PERMISSION_LABELS[PERMISSIONS.NEWS])}
                {renderPermissionItem(PERMISSIONS.DAILY_LEARNING, PERMISSION_LABELS[PERMISSIONS.DAILY_LEARNING])}
                {renderPermissionItem(PERMISSIONS.NEWSLETTERS, PERMISSION_LABELS[PERMISSIONS.NEWSLETTERS])}
                {renderPermissionItem(PERMISSIONS.TZADIKIM, PERMISSION_LABELS[PERMISSIONS.TZADIKIM])}
                {renderPermissionItem(PERMISSIONS.NOTIFICATIONS, PERMISSION_LABELS[PERMISSIONS.NOTIFICATIONS])}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>סיום</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Heebo_700Bold',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Heebo_700Bold',
  },
  badge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Heebo_700Bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Heebo_400Regular',
  },
  permissionsList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  permissionTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    marginLeft: 6,
    marginTop: 4,
    fontFamily: 'Heebo_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    fontFamily: 'Heebo_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'Heebo_700Bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'right',
    marginBottom: 20,
    fontFamily: 'Heebo_400Regular',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    fontFamily: 'Heebo_700Bold',
  },
  permissionsScrollView: {
    maxHeight: 400,
  },
  permissionsContainer: {
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'right',
    fontFamily: 'Heebo_400Regular',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#FFD700',
    alignItems: 'flex-end',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
  },
  doneButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Heebo_700Bold',
  },
});
