import { View, Text, StyleSheet } from 'react-native'
import { STREAK_MILESTONES } from '../utils/helpers'
import { Trophy } from '../types'

interface Props {
  streak: number
  best: number
  /** もらったトロフィー（ここに並べて見せる） */
  trophies?: Trophy[]
  /** 保護者のID→名前（「〇〇からのトロフィー」の表示用） */
  nameOf?: (userId: string) => string | undefined
}

/** これまでの最長の連続日数に応じて光るバッジ。もらったトロフィーも同じカードに並べる */
export default function StreakBadges({ streak, best, trophies = [], nameOf }: Props) {
  const top = Math.max(streak, best)
  const next = STREAK_MILESTONES.find(m => m > top)
  // 新しいものが先（日付なしの自動のものは後ろ）
  const shelf = [...trophies].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
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

      <View style={styles.divider} />
      <View style={styles.head}>
        <Text style={styles.label}>🏆 もらったトロフィー</Text>
        <Text style={styles.best}>{shelf.length}こ</Text>
      </View>
      {shelf.length === 0 ? (
        <Text style={styles.hint}>週の目標を達成したり、つづけて勉強したり、おうちの人から送られると、ここにたまります。</Text>
      ) : (
        <View style={styles.shelf}>
          {shelf.map(t => {
            const from = t.kind === 'parent' && t.from ? nameOf?.(t.from) : undefined
            return (
              <View key={t.id} style={styles.trophy}>
                <Text style={styles.trophyIcon}>{t.icon}</Text>
                <Text style={styles.trophyTitle}>{t.kind === 'parent' ? (from ? `${from}から` : 'おうちの人から') : t.title}</Text>
                {t.date ? <Text style={styles.trophyDate}>{t.date.slice(5).replace('-', '/')}</Text> : null}
              </View>
            )
          })}
        </View>
      )}
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
  hint: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 2 },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trophy: { alignItems: 'center', backgroundColor: '#fff8e8', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, minWidth: 84 },
  trophyIcon: { fontSize: 26 },
  trophyTitle: { fontSize: 11, color: '#b7791f', fontWeight: '700', marginTop: 2, textAlign: 'center' },
  trophyDate: { fontSize: 10, color: '#94a3b8' },
})
