import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp } from '../../src/hooks/AppContext'
import { formatDuration, getTodayStr, getTotalStudyTime, getStreak, getSubjectColor } from '../../src/utils/helpers'
import { StudySession } from '../../src/types'
import { useState } from 'react'

export default function ChildTimer() {
  const { state, dispatch } = useApp()
  const { timerState, currentUser } = state
  const [selected, setSelected] = useState('')

  if (!currentUser) return null

  // 科目が消された／未選択のときは先頭の科目
  const selectedSubject = state.subjects.some(s => s.name === selected) ? selected : (state.subjects[0]?.name ?? '')

  const mySessions = state.studySessions.filter(s => s.userId === currentUser.id)
  const totalTime = getTotalStudyTime(mySessions)
  const streak = getStreak(mySessions)

  const handleStart = () => {
    dispatch({ type: 'START_TIMER', payload: { subject: selectedSubject, userId: currentUser.id, now: Date.now() } })
  }

  const handleStop = () => {
    if (timerState.elapsed < 5) { dispatch({ type: 'STOP_TIMER' }); return }
    const session: StudySession = {
      id: `s-${Date.now()}`,
      userId: currentUser.id,
      subject: timerState.subject,
      duration: timerState.elapsed,
      date: getTodayStr(),
    }
    dispatch({ type: 'SAVE_SESSION', payload: session })
  }

  const color = getSubjectColor(state.subjects, timerState.isRunning ? timerState.subject : selectedSubject)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>⏱️ 学習タイマー</Text>

        {/* Subject selector */}
        {!timerState.isRunning && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>科目を選んでね</Text>
            <View style={styles.subjectRow}>
              {state.subjects.map(s => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSelected(s.name)}
                  style={[styles.subjectBtn, { backgroundColor: selectedSubject === s.name ? s.color : '#f1f5f9' }]}
                >
                  <Text style={[styles.subjectText, { color: selectedSubject === s.name ? 'white' : '#64748b' }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Timer */}
        <View style={[styles.card, styles.timerCard]}>
          {timerState.isRunning && (
            <Text style={styles.studyingLabel}>📖 {timerState.subject}を勉強中</Text>
          )}
          <View style={[styles.timerCircle, { borderColor: color }]}>
            <Text style={[styles.timerText, { color }]}>{formatDuration(timerState.elapsed)}</Text>
          </View>
          <TouchableOpacity
            onPress={timerState.isRunning ? handleStop : handleStart}
            style={[styles.timerBtn, { backgroundColor: timerState.isRunning ? '#fee2e2' : color }]}
          >
            <Text style={[styles.timerBtnText, { color: timerState.isRunning ? '#ef4444' : 'white' }]}>
              {timerState.isRunning ? '⏹ やめる' : '▶ はじめる'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(totalTime)}</Text>
            <Text style={styles.statLabel}>合計時間</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f9a74f' }]}>🔥 {streak}日</Text>
            <Text style={styles.statLabel}>連続学習</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1a202c' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  timerCard: { alignItems: 'center', gap: 16 },
  sectionLabel: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subjectText: { fontSize: 13, fontWeight: '600' },
  studyingLabel: { fontSize: 13, color: '#64748b' },
  timerCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 28, fontWeight: '700' },
  timerBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 50 },
  timerBtnText: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#4f9cf9' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
})
