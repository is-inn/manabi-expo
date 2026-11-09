import { View, Text, StyleSheet } from 'react-native'
import { formatDuration, getLastWeekReview } from '../utils/helpers'

/** 先週（月曜〜日曜）のふりかえりカード */
export default function WeeklyReview({ sessions }: { sessions: { date: string; duration: number; subject: string }[] }) {
  const r = getLastWeekReview(sessions)
  const diff = r.totalSeconds - r.prevSeconds
  const [, m, d] = r.weekStart.split('-').map(Number)

  return (
    <View style={styles.card}>
      <Text style={styles.label}>📅 先週のふりかえり（{m}/{d}〜）</Text>
      {r.totalSeconds === 0 ? (
        <Text style={styles.empty}>先週の記録はありません。今週は少しだけでも、はじめてみよう！</Text>
      ) : (
        <>
          <Text style={styles.total}>{formatDuration(r.totalSeconds)}</Text>
          <Text style={[styles.diff, diff >= 0 ? styles.up : styles.down]}>
            {r.prevSeconds === 0 ? '先々週は記録なし' : diff === 0 ? '先々週と同じ時間' : `先々週より ${formatDuration(Math.abs(diff))} ${diff > 0 ? '増えました 👏' : '少なめでした'}`}
          </Text>
          <View style={styles.row}>
            <View style={styles.box}><Text style={styles.boxValue}>{r.daysStudied}日</Text><Text style={styles.boxLabel}>勉強した日</Text></View>
            <View style={styles.box}><Text style={styles.boxValue}>{r.topSubject ?? '-'}</Text><Text style={styles.boxLabel}>いちばん長い科目</Text></View>
            <View style={styles.box}><Text style={styles.boxValue}>{r.bestDay ? `${r.bestDay.label}曜日` : '-'}</Text><Text style={styles.boxLabel}>がんばった日</Text></View>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 18, gap: 8 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  empty: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  total: { fontSize: 28, fontWeight: '700', color: '#4f9cf9' },
  diff: { fontSize: 13, fontWeight: '600' },
  up: { color: '#1e8e5a' },
  down: { color: '#64748b' },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  box: { flex: 1, backgroundColor: '#f5f7ff', borderRadius: 10, padding: 10, alignItems: 'center' },
  boxValue: { fontSize: 14, fontWeight: '700', color: '#1a202c' },
  boxLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' },
})
