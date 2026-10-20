import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import { useState } from 'react'
import { useApp } from '../../src/hooks/AppContext'
import ConfirmModal from '../../src/components/ConfirmModal'
import { SOLO_USER_ID } from '../../src/utils/defaults'
import { formatDuration, getDailyTotals, getSubjectColor, getTotalStudyTime, toDateStr } from '../../src/utils/helpers'
import { StudySession } from '../../src/types'

export default function SoloLog() {
  const { state, dispatch } = useApp()
  const [pendingDelete, setPendingDelete] = useState<StudySession | null>(null)

  const sessions = state.studySessions.filter(s => s.userId === SOLO_USER_ID)
  const totals = getDailyTotals(sessions)
  const goalSec = state.solo.goalMinutes * 60

  // 新しい日付が上。同じ日の中も新しい順
  const dates = Object.keys(totals).sort().reverse()

  // 今週（直近7日）の合計
  const weekDates = new Set<string>()
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    weekDates.add(toDateStr(d))
  }
  const week = getTotalStudyTime(sessions.filter(s => weekDates.has(s.date)))

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>📝 きろく</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>直近7日間の合計</Text>
          <Text style={styles.summaryValue}>{formatDuration(week)}</Text>
        </View>

        {dates.length === 0 && (
          <Text style={styles.empty}>まだ記録がありません。{'\n'}「けいそく」タブで勉強をはじめよう！</Text>
        )}

        {dates.map(date => (
          <View key={date} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{date}</Text>
              <Text style={[styles.dayTotal, totals[date] >= goalSec && styles.dayReached]}>
                {totals[date] >= goalSec ? '🎉 ' : ''}{formatDuration(totals[date])}
              </Text>
            </View>
            {sessions.filter(s => s.date === date).reverse().map(s => {
              const color = getSubjectColor(state.subjects, s.subject)
              return (
                <View key={s.id} style={styles.row}>
                  <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
                    <Text style={[styles.badgeText, { color }]}>{s.subject}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTime}>{formatDuration(s.duration)}</Text>
                    {s.note ? <Text style={styles.rowNote}>{s.note}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => setPendingDelete(s)}>
                    <Text style={styles.deleteBtn}>×</Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </View>
        ))}
      </ScrollView>

      <ConfirmModal
        visible={pendingDelete !== null}
        title="この記録を削除しますか？"
        message={pendingDelete ? `${pendingDelete.subject}　${formatDuration(pendingDelete.duration)}\n元に戻せません。` : ''}
        onConfirm={() => { if (pendingDelete) dispatch({ type: 'DELETE_SESSION', payload: pendingDelete.id }); setPendingDelete(null) }}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 12 },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  summary: { backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#64748b' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#4f9cf9', marginTop: 2 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, lineHeight: 22, padding: 32 },
  dayBlock: { gap: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  dayTitle: { fontSize: 13, fontWeight: '700', color: '#475569' },
  dayTotal: { fontSize: 13, color: '#64748b' },
  dayReached: { color: '#1e8e5a', fontWeight: '700' },
  row: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginTop: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  rowInfo: { flex: 1, gap: 2 },
  rowTime: { fontSize: 14, fontWeight: '700', color: '#1a202c' },
  rowNote: { fontSize: 13, color: '#475569', lineHeight: 18 },
  deleteBtn: { fontSize: 22, color: '#cbd5e1', paddingHorizontal: 4 },
})
