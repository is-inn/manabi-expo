import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useApp } from '../../src/hooks/AppContext'
import { SOLO_USER_ID } from '../../src/utils/defaults'
import { formatDuration, getDailyTotals, getGoalStreak, getTodayStr, getTotalStudyTime, getSubjectColor, toDateStr } from '../../src/utils/helpers'

export default function SoloHome() {
  const { state } = useApp()
  const router = useRouter()
  const sessions = state.studySessions.filter(s => s.userId === SOLO_USER_ID)
  const goalSec = state.solo.goalMinutes * 60

  const totals = getDailyTotals(sessions)
  const today = totals[getTodayStr()] ?? 0
  const reached = today >= goalSec
  const remaining = Math.max(goalSec - today, 0)
  const streak = getGoalStreak(sessions, goalSec)
  const total = getTotalStudyTime(sessions)

  const last7: { label: string; total: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7.push({ label: ['日', '月', '火', '水', '木', '金', '土'][d.getDay()], total: totals[toDateStr(d)] ?? 0 })
  }
  const maxDay = Math.max(...last7.map(d => d.total), goalSec, 1)

  const recent = sessions.filter(s => s.note).slice(-3).reverse()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroSub}>こんにちは！</Text>
          <Text style={styles.heroName}>{state.solo.name || 'あなた'}さん</Text>
          <Text style={styles.heroStreak}>
            {streak > 0 ? `🔥 目標を${streak}日連続で達成中！` : '今日の目標をめざそう！'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.goalRow}>
            <Text style={styles.cardLabel}>今日の勉強</Text>
            <Text style={styles.goalText}>{formatDuration(today)} / {formatDuration(goalSec)}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(today / goalSec, 1) * 100}%` as any }, reached && styles.barDone]} />
          </View>
          <Text style={[styles.goalMsg, reached && styles.goalMsgDone]}>
            {reached ? '🎉 今日の目標を達成！' : `あと ${formatDuration(remaining)} で達成`}
          </Text>
          <TouchableOpacity onPress={() => router.push('/solo/timer')} style={styles.startBtn}>
            <Text style={styles.startText}>⏱️ 勉強をはじめる</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f9a74f' }]}>🔥 {streak}日</Text>
            <Text style={styles.statLabel}>連続達成</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(total)}</Text>
            <Text style={styles.statLabel}>合計の勉強時間</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>直近7日間</Text>
          <View style={styles.chart}>
            {last7.map((day, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, {
                  height: day.total > 0 ? Math.max((day.total / maxDay) * 60, 6) : 4,
                  backgroundColor: day.total >= goalSec ? '#4fcf8e' : day.total > 0 ? '#4f9cf9' : '#f1f5f9',
                }]} />
                <Text style={styles.barLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.legend}>緑は目標を達成した日です</Text>
        </View>

        {recent.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>最近のがんばり</Text>
            {recent.map(s => (
              <View key={s.id} style={styles.noteRow}>
                <View style={[styles.noteDot, { backgroundColor: getSubjectColor(state.subjects, s.subject) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteTitle}>{s.subject}・{formatDuration(s.duration)}　<Text style={styles.noteDate}>{s.date}</Text></Text>
                  <Text style={styles.noteText}>{s.note}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  hero: { backgroundColor: '#4fcf8e', borderRadius: 20, padding: 24 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 4 },
  heroName: { color: 'white', fontSize: 24, fontWeight: '700' },
  heroStreak: { color: 'rgba(255,255,255,0.95)', fontSize: 13, marginTop: 8 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 18, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalText: { fontSize: 14, fontWeight: '700', color: '#1a202c' },
  barBg: { backgroundColor: '#f1f5f9', borderRadius: 99, height: 10 },
  barFill: { backgroundColor: '#4f9cf9', height: '100%', borderRadius: 99 },
  barDone: { backgroundColor: '#4fcf8e' },
  goalMsg: { fontSize: 13, color: '#64748b' },
  goalMsgDone: { color: '#1e8e5a', fontWeight: '700' },
  startBtn: { backgroundColor: '#4fcf8e', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  startText: { color: 'white', fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#4f9cf9' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  chart: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 80 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#94a3b8' },
  legend: { fontSize: 10, color: '#94a3b8' },
  noteRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noteDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  noteTitle: { fontSize: 13, fontWeight: '700', color: '#1a202c' },
  noteDate: { fontSize: 11, color: '#94a3b8', fontWeight: '400' },
  noteText: { fontSize: 13, color: '#475569', marginTop: 2, lineHeight: 18 },
})
