import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function AppHeader({
  title,
  subtitle,
  onBackPress,
  showBackButton = true,
  rightIcon,
  onRightIconPress,
  leftIcon,
  onLeftIconPress,
  badge
}) {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.header}
    >
      <View style={styles.content}>
        {/* Left side buttons - positioned absolutely */}
        <View style={styles.leftButtonsContainer}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward" size={24} color="#FFD700" />
            </TouchableOpacity>
          )}

          {leftIcon && !showBackButton && (
            <TouchableOpacity
              style={styles.leftButton}
              onPress={onLeftIconPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name={leftIcon} size={24} color="#FFD700" />
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Center title - always centered */}
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Right side buttons - positioned absolutely */}
        <View style={styles.rightButtonsContainer}>
          {rightIcon && (
            <TouchableOpacity
              style={styles.rightButton}
              onPress={onRightIconPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name={rightIcon} size={24} color="#FFD700" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  leftButtonsContainer: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    padding: 8,
    position: 'relative',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonsContainer: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  rightButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    fontFamily: 'Heebo_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Heebo_400Regular',
  },
});
