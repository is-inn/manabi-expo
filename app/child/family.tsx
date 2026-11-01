import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp } from '../../src/hooks/AppContext'
import { ALL_PRIVATE } from '../../src/utils/defaults'
import Avatar from '../../src/components/Avatar'
import { formatDuration, getDaysUntil, getSubjectColor, getSubjectTotals, getTotalStudyTime, getWeekSessions } from '../../src/utils/helpers'

/** 「おうちの人」: 保護者が公開にした項目だけを表示する。非公開の項目は描画しない */
export default function ChildFamily() {
  const { state } = useApp()
  const parents = state.users.filter(u => u.role === 'parent')

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>👪 おうちの人</Text>
        {parents.length === 0 && <Text style={styles.empty}>保護者が登録されていません</Text>}

        {parents.map(p => {
          const vis = state.visibility[p.id] ?? ALL_PRIVATE
          const sessions = state.studySessions.filter(s => s.userId === p.id)
          const week = getWeekSessions(sessions)
          const goal = state.goals.find(g => g.userId === p.id)
          const tasks = state.tasks.filter(t => t.assignedTo === p.id)
          const subjectTotals = getSubjectTotals(sessions)
          const anyVisible = Object.values(vis).some(Boolean)
          // 目標が決まっていないなら「目標」は出せない
          const showGoal = vis.goal && !!goal
          const weekSeconds = getTotalStudyTime(week)

          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.nameRow}><Avatar avatar={p.avatar} size={32} /><Text style={styles.name}>{p.name}</Text></View>
              {!anyVisible && <Text style={styles.empty}>公開されている項目はありません</Text>}

              {vis.total && <Row label="累計の学習時間" value={formatDuration(getTotalStudyTime(sessions))} />}
              {vis.week && <Row label="今週の学習時間" value={formatDuration(weekSeconds)} />}
              {showGoal && goal && (
                <View style={styles.block}>
                  <Text style={styles.rowLabel}>🎯 {goal.title || '週の目標'}</Text>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${Math.min(Math.round((weekSeconds / (goal.weeklyMinutes * 60)) * 100), 100)}%` }]} />
                  </View>
                  <Text style={styles.sub}>
                    達成率 {Math.round((weekSeconds / (goal.weeklyMinutes * 60)) * 100)}%
                    {goal.deadline ? `　期限まであと${Math.max(getDaysUntil(goal.deadline), 0)}日` : ''}
                  </Text>
                </View>
              )}
              {vis.subjects && (
                <View style={styles.block}>
                  <Text style={styles.rowLabel}>学習している科目</Text>
                  <View style={styles.chips}>
                    {subjectTotals.length === 0 && <Text style={styles.sub}>まだ記録がありません</Text>}
                    {subjectTotals.map(t => (
                      <View key={t.subject} style={[styles.chip, { backgroundColor: getSubjectColor(state.subjects, t.subject) }]}>
                        <Text style={styles.chipText}>{t.subject}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {vis.tasks && (
                <View style={styles.block}>
                  <Text style={styles.rowLabel}>タスク</Text>
                  {tasks.length === 0 && <Text style={styles.sub}>タスクはありません</Text>}
                  {tasks.map(t => (
                    <Text key={t.id} style={styles.sub}>{t.completed ? '✅' : '⬜'} {t.title}（{t.subject}）</Text>
                  ))}
                </View>
              )}
              {vis.taskTime && (
                <View style={styles.block}>
                  <Text style={styles.rowLabel}>科目ごとの学習時間</Text>
                  {subjectTotals.length === 0 && <Text style={styles.sub}>まだ記録がありません</Text>}
                  {subjectTotals.map(t => (
                    <View key={t.subject} style={styles.timeRow}>
                      <View style={[styles.dot, { backgroundColor: getSubjectColor(state.subjects, t.subject) }]} />
                      <Text style={styles.timeName}>{t.subject}</Text>
                      <Text style={styles.timeValue}>{formatDuration(t.seconds)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  empty: { fontSize: 13, color: '#94a3b8' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  rowValue: { fontSize: 16, fontWeight: '700', color: '#4f9cf9' },
  block: { gap: 6 },
  sub: { fontSize: 12, color: '#64748b' },
  bar: { height: 10, borderRadius: 5, backgroundColor: '#e8f3fe', overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: '#4f9cf9' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  chipText: { color: 'white', fontSize: 12, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  timeName: { flex: 1, fontSize: 13, color: '#1a202c' },
  timeValue: { fontSize: 13, fontWeight: '600', color: '#64748b' },
})
