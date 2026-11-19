import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useApp } from '../../src/hooks/AppContext'
import Avatar from '../../src/components/Avatar'
import { formatDuration, getTotalStudyTime, getStreak, isTaskDone, isTaskForDay } from '../../src/utils/helpers'

export default function ParentHome() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const user = state.currentUser

  useEffect(() => {
    if (!user) router.replace('/')
  }, [user])

  if (!user) return null

  const children = state.users.filter(u => u.role === 'child')

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>👨‍👩‍👧‍👦 ファミリーダッシュボード</Text>
          <TouchableOpacity onPress={() => dispatch({ type: 'LOGOUT' })} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 && (
          <Text style={styles.empty}>こどもが登録されていません。{'\n'}「設定」タブから追加してください。</Text>
        )}

        {children.map(child => {
          const sessions = state.studySessions.filter(s => s.userId === child.id)
          // 今日やるもの（くり返しは曜日が合うものだけ）の達成数
          const tasks = state.tasks.filter(t => t.assignedTo === child.id && isTaskForDay(t))
          const done = tasks.filter(t => isTaskDone(t)).length
          const total = getTotalStudyTime(sessions)
          const streak = getStreak(sessions)

          return (
            <View key={child.id} style={styles.childCard}>
              <View style={styles.childHeader}>
                <Avatar avatar={child.avatar} size={36} />
                <View>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childStreak}>🔥 {streak}日連続</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>学習時間</Text>
                  <Text style={styles.statValue}>{formatDuration(total)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>タスク進捗</Text>
                  <Text style={[styles.statValue, { color: '#4fcf8e' }]}>{done}/{tasks.length}</Text>
                </View>
              </View>
              {tasks.length > 0 && (
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${(done / tasks.length) * 100}%` as any }]} />
                </View>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  logoutBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutText: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, lineHeight: 22, padding: 32 },
  childCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, borderTopWidth: 4, borderTopColor: '#4f9cf9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 12 },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  childAvatar: { fontSize: 36 },
  childName: { fontSize: 18, fontWeight: '700' },
  childStreak: { fontSize: 12, color: '#64748b' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#4f9cf9' },
  progressBg: { backgroundColor: '#f1f5f9', borderRadius: 99, height: 6 },
  progressFill: { backgroundColor: '#4fcf8e', height: '100%', borderRadius: 99 },
})
