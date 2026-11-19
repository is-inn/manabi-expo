import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { useApp } from '../../src/hooks/AppContext'
import { PARENT_TROPHY_ICONS } from '../../src/utils/trophies'
import RecentNotes from '../../src/components/RecentNotes'
import { makeId } from '../../src/utils/helpers'
import Avatar from '../../src/components/Avatar'
import WeeklyReview from '../../src/components/WeeklyReview'
import { formatDuration, getTotalStudyTime, getStreak, getSubjectColor, getTodayStr, toDateStr } from '../../src/utils/helpers'

export default function ParentProgress() {
  const { state, dispatch } = useApp()
  const [sendingTo, setSendingTo] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const sendTrophy = (userId: string, icon: string) => {
    dispatch({ type: 'AWARD_TROPHIES', payload: [{ id: makeId('pt'), userId, kind: 'parent', icon, title: 'おうちの人から', date: getTodayStr(), from: state.currentUser?.id }] })
    setSendingTo(null)
    setSentTo(userId)
  }
  // こどもが先、そのあとに保護者（保護者の「じぶんの勉強」の記録も一緒に見られる）
  const children = [...state.users.filter(u => u.role === 'child'), ...state.users.filter(u => u.role === 'parent')]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>📊 学習進捗</Text>

        {children.map(child => {
          // 自分（ログイン中の保護者）の分は、ひとりモードで付けた記録もあわせて数える
          const sessions = state.studySessions.filter(s => s.userId === child.id || (child.id === state.currentUser?.id && child.role === 'parent' && s.userId === 'solo'))
          const totalTime = getTotalStudyTime(sessions)
          const streak = getStreak(sessions)

          const subjectTotals: Record<string, number> = {}
          sessions.forEach(s => { subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.duration })
          const maxDuration = Math.max(...Object.values(subjectTotals), 1)

          const last7: { label: string; total: number }[] = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = toDateStr(d)
            const dayTotal = sessions.filter(s => s.date === dateStr).reduce((a, s) => a + s.duration, 0)
            const dayLabel = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
            last7.push({ label: dayLabel, total: dayTotal })
          }
          const maxDay = Math.max(...last7.map(d => d.total), 1)

          return (
            <View key={child.id} style={styles.card}>
              <View style={styles.childRow}>
                <Avatar avatar={child.avatar} size={36} />
                <Text style={styles.childName}>{child.name}</Text>
                {child.role === 'parent' && <Text style={styles.roleTag}>保護者</Text>}
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

              <WeeklyReview sessions={sessions} />

              {/* トロフィー：もらったもの／こどもへ送る */}
              {(() => {
                const mine = state.trophies.filter(t => t.userId === child.id)
                return (
                  <>
                    <Text style={styles.sectionLabel}>🏆 トロフィー（{mine.length}こ）</Text>
                    {mine.length > 0 && (
                      <View style={styles.trophyRow}>
                        {mine.map(t => <Text key={t.id} style={styles.trophyChip}>{t.icon} {t.kind === 'parent' ? 'おうちの人から' : t.title}</Text>)}
                      </View>
                    )}
                    {child.role === 'child' && (
                      sendingTo === child.id ? (
                        <View style={styles.trophyRow}>
                          {PARENT_TROPHY_ICONS.map(ic => (
                            <TouchableOpacity key={ic} onPress={() => sendTrophy(child.id, ic)} style={styles.iconPick}>
                              <Text style={styles.iconPickText}>{ic}</Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity onPress={() => setSendingTo(null)} style={styles.sendCancel}><Text style={styles.sendCancelText}>やめる</Text></TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => { setSendingTo(child.id); setSentTo(null) }} style={styles.sendBtn}>
                          <Text style={styles.sendBtnText}>🏆 {child.name}にトロフィーを送る</Text>
                        </TouchableOpacity>
                      )
                    )}
                    {sentTo === child.id && <Text style={styles.sentMsg}>送りました！{child.name}のホームに届きます。</Text>}
                  </>
                )
              })()}

              <RecentNotes sessions={sessions} subjects={state.subjects} limit={5} />

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
                        <View style={[styles.subjectBarFill, { width: `${(dur / maxDuration) * 100}%` as any, backgroundColor: getSubjectColor(state.subjects, subject) }]} />
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
  roleTag: { fontSize: 11, color: '#4f9cf9', backgroundColor: '#e8f3fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#e8f3fe', borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 11, color: '#4f9cf9', fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#4f9cf9' },
  sectionLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  trophyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  trophyChip: { fontSize: 12, color: '#b7791f', backgroundColor: '#fff8e8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, overflow: 'hidden', fontWeight: '600' },
  sendBtn: { backgroundColor: '#fff4d6', padding: 12, borderRadius: 10, alignItems: 'center' },
  sendBtnText: { color: '#b7791f', fontWeight: '700', fontSize: 13 },
  iconPick: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff4d6', alignItems: 'center', justifyContent: 'center' },
  iconPickText: { fontSize: 24 },
  sendCancel: { paddingHorizontal: 10, paddingVertical: 8 },
  sendCancelText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  sentMsg: { fontSize: 12, color: '#1e8e5a', fontWeight: '600' },
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
