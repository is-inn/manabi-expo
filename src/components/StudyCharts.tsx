import { View, Text, StyleSheet } from 'react-native'
import { useApp } from '../hooks/AppContext'
import { formatDuration, getSubjectColor, toDateStr } from '../utils/helpers'
import { StudySession } from '../types'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

interface Props {
  sessions: StudySession[]
  /** 直近7日間のグラフを出す（ひとりモードのホームには、すでに別のグラフがあるので false） */
  showWeek?: boolean
  /** 子ども向けのひらがな表記 */
  kids?: boolean
}

/** 直近7日間のグラフと、科目ごとの小計。ホーム画面用 */
export default function StudyCharts({ sessions, showWeek = true, kids = false }: Props) {
  const { state } = useApp()

  const last7: { label: string; total: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    last7.push({ label: WEEKDAYS[d.getDay()], total: sessions.filter(s => s.date === ds).reduce((a, s) => a + s.duration, 0) })
  }
  const maxDay = Math.max(...last7.map(d => d.total), 1)

  const subjectTotals: Record<string, number> = {}
  sessions.forEach(s => { subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.duration })
  const maxSubject = Math.max(...Object.values(subjectTotals), 1)
  const rows = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1])

  return (
    <>
      {showWeek && (
        <View style={styles.card}>
          <Text style={styles.title}>{kids ? '📊 この7日間のべんきょう' : '📊 直近7日間'}</Text>
          <View style={styles.chart}>
            {last7.map((day, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: day.total > 0 ? Math.max((day.total / maxDay) * 60, 6) : 4, backgroundColor: day.total > 0 ? '#4f9cf9' : '#f1f5f9' }]} />
                <Text style={styles.barLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.title}>{kids ? '📚 かもくごとの じかん' : '📚 科目ごとの合計'}</Text>
        {rows.length === 0 ? (
          <Text style={styles.empty}>{kids ? 'べんきょうすると、ここに出るよ！' : '勉強を記録すると、ここに科目ごとの時間が出ます。'}</Text>
        ) : rows.map(([subject, dur]) => (
          <View key={subject} style={styles.subjectRow}>
            <View style={styles.subjectLabelRow}>
              <Text style={styles.subjectName}>{subject}</Text>
              <Text style={styles.subjectDur}>{formatDuration(dur)}</Text>
            </View>
            <View style={styles.subjectBarBg}>
              <View style={[styles.subjectBarFill, { width: `${(dur / maxSubject) * 100}%` as any, backgroundColor: getSubjectColor(state.subjects, subject) }]} />
            </View>
          </View>
        ))}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 18, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#1a202c' },
  empty: { fontSize: 13, color: '#94a3b8' },
  chart: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 80 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#94a3b8' },
  subjectRow: { gap: 4 },
  subjectLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { fontSize: 13, fontWeight: '600', color: '#1a202c' },
  subjectDur: { fontSize: 13, color: '#64748b' },
  subjectBarBg: { backgroundColor: '#f1f5f9', borderRadius: 99, height: 8 },
  subjectBarFill: { height: '100%', borderRadius: 99 },
})
