import React, { useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, FlatList, Pressable, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const GOLD = '#E63946'
const BG = '#FFFFFF'
const DEEP_BLUE = '#2D6A4F'

// Mock data for live alerts
const ALERTS = [
  {
    id: 'alert-1',
    type: 'buy',
    symbol: 'AAPL',
    title: 'Apple Inc.',
    price: '$182.45',
    change: '+2.4%',
    message: 'פריצה מעל רמת התנגדות קריטית ב-$180. מומנטום חיובי.',
    time: '2 דקות',
    priority: 'high',
  },
  {
    id: 'alert-2',
    type: 'sell',
    symbol: 'TSLA',
    title: 'Tesla Inc.',
    price: '$245.30',
    change: '-1.8%',
    message: 'שבירת תמיכה ב-$250. שקול להפחית חשיפה.',
    time: '15 דקות',
    priority: 'medium',
  },
  {
    id: 'alert-3',
    type: 'watch',
    symbol: 'NVDA',
    title: 'NVIDIA Corp.',
    price: '$495.20',
    change: '+0.8%',
    message: 'התקרבות לאזור קנייה. צפה להזדמנות entry.',
    time: '1 שעה',
    priority: 'low',
  },
  {
    id: 'alert-4',
    type: 'buy',
    symbol: 'MSFT',
    title: 'Microsoft Corp.',
    price: '$378.90',
    change: '+1.2%',
    message: 'דפוס bullish flag. פוטנציאל breakout קרוב.',
    time: '2 שעות',
    priority: 'high',
  },
  {
    id: 'alert-5',
    type: 'watch',
    symbol: 'GOOGL',
    title: 'Alphabet Inc.',
    price: '$142.15',
    change: '+0.5%',
    message: 'המתנה להתארגנות נוספת ליד $140.',
    time: '3 שעות',
    priority: 'low',
  },
  {
    id: 'alert-6',
    type: 'sell',
    symbol: 'META',
    title: 'Meta Platforms',
    price: '$485.60',
    change: '-2.1%',
    message: 'חולשה תחת Moving Average. שקול לסגור פוזיציה.',
    time: '4 שעות',
    priority: 'medium',
  },
]

export default function LiveAlertsScreen({ navigation }) {
  const [filter, setFilter] = useState('all') // all, buy, sell, watch

  const filteredAlerts = filter === 'all'
    ? ALERTS
    : ALERTS.filter(alert => alert.type === filter)

  const getTypeIcon = (type) => {
    switch (type) {
      case 'buy': return 'trending-up'
      case 'sell': return 'trending-down'
      case 'watch': return 'eye-outline'
      default: return 'notifications-outline'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'buy': return '#16a34a'
      case 'sell': return '#dc2626'
      case 'watch': return '#f59e0b'
      default: return GOLD
    }
  }

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high': return { borderColor: '#dc2626', borderWidth: 1.5 }
      case 'medium': return { borderColor: '#f59e0b', borderWidth: 1 }
      default: return { borderColor: 'rgba(11,27,58,0.08)', borderWidth: StyleSheet.hairlineWidth }
    }
  }

  const renderAlert = ({ item }) => {
    const typeColor = getTypeColor(item.type)
    const typeIcon = getTypeIcon(item.type)
    const isPositive = item.change.startsWith('+')

    return (
      <Pressable
        style={[styles.alertCard, getPriorityStyle(item.priority)]}
        accessibilityRole="button"
      >
        {/* Priority indicator */}
        {item.priority === 'high' && (
          <View style={styles.priorityBadge}>
            <Ionicons name="flame" size={14} color="#dc2626" />
            <Text style={styles.priorityText}>דחוף</Text>
          </View>
        )}

        <View style={styles.alertHeader}>
          <View style={styles.alertHeaderRight}>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>

          <View style={styles.alertHeaderLeft}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
              <Ionicons name={typeIcon} size={20} color={typeColor} />
            </View>
          </View>
        </View>

        <View style={styles.alertBody}>
          <View style={styles.stockInfo}>
            <View style={styles.stockHeader}>
              <View style={styles.priceContainer}>
                <Text style={styles.stockPrice}>{item.price}</Text>
                <View style={[styles.changePill, { backgroundColor: isPositive ? '#16a34a15' : '#dc262615' }]}>
                  <Ionicons
                    name={isPositive ? 'caret-up' : 'caret-down'}
                    size={12}
                    color={isPositive ? '#16a34a' : '#dc2626'}
                  />
                  <Text style={[styles.changeText, { color: isPositive ? '#16a34a' : '#dc2626' }]}>
                    {item.change}
                  </Text>
                </View>
              </View>
              <View style={styles.stockTitleContainer}>
                <Text style={styles.stockSymbol}>{item.symbol}</Text>
                <Text style={styles.stockTitle}>{item.title}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.alertMessage}>{item.message}</Text>
        </View>

        <View style={styles.alertFooter}>
          <Pressable style={styles.actionButton}>
            <Ionicons name="chevron-back" size={16} color={GOLD} />
            <Text style={styles.actionButtonText}>פרטים נוספים</Text>
          </Pressable>
        </View>
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.headerTitle}>התראות חמות</Text>
        <Pressable style={styles.settingsBtn} accessibilityRole="button">
          <Ionicons name="settings-outline" size={22} color={DEEP_BLUE} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterTab, filter === 'watch' && styles.filterTabActive]}
          onPress={() => setFilter('watch')}
        >
          <Ionicons name="eye-outline" size={18} color={filter === 'watch' ? GOLD : '#6b7280'} />
          <Text style={[styles.filterTabText, filter === 'watch' && styles.filterTabTextActive]}>
            מעקב
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filter === 'sell' && styles.filterTabActive]}
          onPress={() => setFilter('sell')}
        >
          <Ionicons name="trending-down" size={18} color={filter === 'sell' ? GOLD : '#6b7280'} />
          <Text style={[styles.filterTabText, filter === 'sell' && styles.filterTabTextActive]}>
            מכירה
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filter === 'buy' && styles.filterTabActive]}
          onPress={() => setFilter('buy')}
        >
          <Ionicons name="trending-up" size={18} color={filter === 'buy' ? GOLD : '#6b7280'} />
          <Text style={[styles.filterTabText, filter === 'buy' && styles.filterTabTextActive]}>
            קנייה
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Ionicons name="list-outline" size={18} color={filter === 'all' ? GOLD : '#6b7280'} />
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            הכל
          </Text>
        </Pressable>
      </View>

      {/* Live Indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>עדכונים בזמן אמת</Text>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: Platform.select({ ios: 12, android: 12, default: 12 }),
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: GOLD,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.08)',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(11,27,58,0.04)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: GOLD,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 14,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dc262615',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#dc2626',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
  },
  alertBody: {
    gap: 10,
  },
  stockInfo: {
    gap: 8,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stockTitleContainer: {
    alignItems: 'flex-end',
  },
  stockSymbol: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
  },
  stockTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-start',
    gap: 6,
  },
  stockPrice: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  changeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#4b5563',
    lineHeight: 20,
    textAlign: 'right',
  },
  alertFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(11,27,58,0.08)',
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: GOLD,
  },
})
