import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import ParentGateModal from '../../src/components/ParentGateModal'
import { useRouter } from 'expo-router'
import { useApp } from '../../src/hooks/AppContext'
import { formatDuration, getTotalStudyTime, getStreak, getBestStreak, isTaskDone, isTaskForDay } from '../../src/utils/helpers'
import StreakBadges from '../../src/components/StreakBadges'
import WeeklyReview from '../../src/components/WeeklyReview'
import StudyCharts from '../../src/components/StudyCharts'
import ReminderSettings from '../../src/components/ReminderSettings'
import { avatarAsText } from '../../src/utils/avatar'

export default function ChildHome() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const user = state.currentUser
  const [gateOpen, setGateOpen] = useState(false)

  // レンダー中に遷移しない（React の副作用ルール順守）
  useEffect(() => {
    if (!user) router.replace('/')
  }, [user])

  if (!user) return null

  const mySessions = state.studySessions.filter(s => s.userId === user.id)
  const myTasks = state.tasks.filter(t => t.assignedTo === user.id)
  const pending = myTasks.filter(t => isTaskForDay(t) && !isTaskDone(t))
  const totalTime = getTotalStudyTime(mySessions)
  const streak = getStreak(mySessions)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSub}>こんにちは！</Text>
          <Text style={styles.heroName}>{avatarAsText(user.avatar)} {user.name}さん</Text>
          <Text style={styles.heroStreak}>{streak > 0 ? `🔥 ${streak}日連続がんばってるよ！` : 'さあ、今日も勉強しよう！'}</Text>
          <TouchableOpacity onPress={() => dispatch({ type: 'LOGOUT' })} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(totalTime)}</Text>
            <Text style={styles.statLabel}>合計学習時間</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f97b4f' }]}>{pending.length}</Text>
            <Text style={styles.statLabel}>残りタスク</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionCard, { borderColor: '#e8f3fe' }]} onPress={() => router.push('/child/timer')}>
            <Text style={styles.actionIcon}>⏱️</Text>
            <Text style={[styles.actionTitle, { color: '#4f9cf9' }]}>タイマー</Text>
            <Text style={styles.actionSub}>勉強をはじめよう</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { borderColor: '#fff8e8' }]} onPress={() => router.push('/child/tasks')}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={[styles.actionTitle, { color: '#f9a74f' }]}>タスク</Text>
            <Text style={styles.actionSub}>{pending.length}個のこってるよ</Text>
          </TouchableOpacity>
        </View>

        <StreakBadges
          streak={streak}
          best={getBestStreak(mySessions)}
          trophies={state.trophies.filter(t => t.userId === user.id)}
          nameOf={id => state.users.find(u => u.id === id)?.name}
        />
        <WeeklyReview sessions={mySessions} />
        <StudyCharts sessions={mySessions} kids />
        <ReminderSettings />

        <TouchableOpacity
          onPress={() => dispatch({ type: 'SET_TUTORIAL_SEEN', payload: { userId: user.id, seen: false } })}
          style={styles.helpBtn}
        >
          <Text style={styles.helpText}>📖 つかいかたを見る</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setGateOpen(true)} style={styles.modeBtn}>
          <Text style={styles.modeText}>🔁 つかいかたを かえる（ひとりで／家族で）</Text>
          <Text style={styles.modeSub}>おとなのかくにんが必要です</Text>
        </TouchableOpacity>
      </ScrollView>

      <ParentGateModal
        visible={gateOpen}
        purpose="つかいかたの切りかえ"
        onPass={() => { setGateOpen(false); router.replace('/welcome') }}
        onCancel={() => setGateOpen(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  heroCard: { backgroundColor: '#4f9cf9', borderRadius: 20, padding: 24 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 4 },
  heroName: { color: 'white', fontSize: 24, fontWeight: '700' },
  heroStreak: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 8 },
  logoutBtn: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { color: 'white', fontSize: 12 },
  helpBtn: { alignSelf: 'center', backgroundColor: '#e8fef3', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  helpText: { color: '#1e8e5a', fontWeight: '700', fontSize: 14 },
  modeBtn: { alignSelf: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center', gap: 2 },
  modeText: { color: '#4f46e5', fontWeight: '700', fontSize: 14 },
  modeSub: { color: '#94a3b8', fontSize: 11 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#4f9cf9' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionIcon: { fontSize: 36, marginBottom: 8 },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  actionSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
})
