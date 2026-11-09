import { View, Text, StyleSheet } from 'react-native'
import { STREAK_MILESTONES } from '../utils/helpers'

/** これまでの最長の連続日数に応じて光るバッジ */
export default function StreakBadges({ streak, best }: { streak: number; best: number }) {
  const top = Math.max(streak, best)
  const next = STREAK_MILESTONES.find(m => m > top)
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.label}>れんぞくバッジ</Text>
        <Text style={styles.best}>最長 {top}日</Text>
      </View>
      <View style={styles.row}>
        {STREAK_MILESTONES.map(m => {
          const got = top >= m
          return (
            <View key={m} style={[styles.badge, got && styles.badgeOn]}>
              <Text style={styles.emoji}>{got ? '🏅' : '🔒'}</Text>
              <Text style={[styles.days, got && styles.daysOn]}>{m}日</Text>
            </View>
          )
        })}
      </View>
      <Text style={styles.hint}>{next ? `あと${next - streak}日続けると「${next}日」のバッジ！` : 'ぜんぶのバッジをゲット！すごい！'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 18, gap: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  best: { fontSize: 12, color: '#f9a74f', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 6 },
  badge: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  badgeOn: { backgroundColor: '#fff4d6' },
  emoji: { fontSize: 20 },
  days: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  daysOn: { color: '#b7791f' },
  hint: { fontSize: 12, color: '#64748b' },
})
