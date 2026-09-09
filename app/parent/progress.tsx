import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import { useApp } from '../../src/hooks/AppContext'
import { formatDuration, getTotalStudyTime, getStreak } from '../../src/utils/helpers'
import { SUBJECT_COLORS } from '../../src/utils/mockData'

export default function ParentProgress() {
  const { state } = useApp()
  const children = state.users.filter(u => u.role === 'child')

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>📊 学習進捗</Text>

        {children.map(child => {
          const sessions = state.studySessions.filter(s => s.userId === child.id)
          const totalTime = getTotalStudyTime(sessions)
          const streak = getStreak(sessions)

          const subjectTotals: Record<string, number> = {}
          sessions.forEach(s => { subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.duration })
          const maxDuration = Math.max(...Object.values(subjectTotals), 1)

          const last7: { label: string; total: number }[] = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]
            const dayTotal = sessions.filter(s => s.date === dateStr).reduce((a, s) => a + s.duration, 0)
            const dayLabel = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
            last7.push({ label: dayLabel, total: dayTotal })
          }
          const maxDay = Math.max(...last7.map(d => d.total), 1)

          return (
            <View key={child.id} style={styles.card}>
              <View style={styles.childRow}>
                <Text style={styles.childAvatar}>{child.avatar}</Text>
                <Text style={styles.childName}>{child.name}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>合計時間</Text>
                  <Text style={styles.statValue}>{formatDuration(totalTime)}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#fff8e8' }]}>
                  <Text style={[styles.statLabel, { color: '#f9a74f' }]}>STREAK</Text>
                  <Text style={[styles.statValue, { color: '#f9a74f' }]}>🔥 {streak}日</Text>
                </View>
              </View>

              {/* Weekly chart */}
              <Text style={styles.sectionLabel}>直近7日間</Text>
              <View style={styles.barChart}>
                {last7.map((day, i) => {
                  const h = day.total > 0 ? Math.max((day.total / maxDay) * 60, 6) : 4
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.bar, { height: h, backgroundColor: day.total > 0 ? '#4f9cf9' : '#f1f5f9' }]} />
                      <Text style={styles.barLabel}>{day.label}</Text>
                    </View>
                  )
                })}
              </View>

              {/* Subject bars */}
              {Object.keys(subjectTotals).length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>科目別</Text>
                  {Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]).map(([subject, dur]) => (
                    <View key={subject} style={styles.subjectRow}>
                      <View style={styles.subjectLabelRow}>
                        <Text style={styles.subjectName}>{subject}</Text>
                        <Text style={styles.subjectDur}>{formatDuration(dur)}</Text>
                      </View>
                      <View style={styles.subjectBarBg}>
                        <View style={[styles.subjectBarFill, { width: `${(dur / maxDuration) * 100}%` as any, backgroundColor: SUBJECT_COLORS[subject] || '#4f9cf9' }]} />
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  childAvatar: { fontSize: 28 },
  childName: { fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#e8f3fe', borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 11, color: '#4f9cf9', fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#4f9cf9' },
  sectionLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  barChart: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 80 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#94a3b8' },
  subjectRow: { gap: 4 },
  subjectLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { fontSize: 12, fontWeight: '600' },
  subjectDur: { fontSize: 12, color: '#64748b' },
  subjectBarBg: { backgroundColor: '#f1f5f9', borderRadius: 99, height: 8 },
  subjectBarFill: { height: '100%', borderRadius: 99 },
})
