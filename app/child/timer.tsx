import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp } from '../../src/hooks/AppContext'
import { formatClock, formatDuration, getTodayStr, getTotalStudyTime, getStreak, getSubjectColor } from '../../src/utils/helpers'
import { TIMER_PRESETS } from '../../src/utils/defaults'
import FinishRecordModal from '../../src/components/FinishRecordModal'
import RecentNotes from '../../src/components/RecentNotes'
import { useEffect, useState } from 'react'

const MIN_SAVE_SECONDS = 5

export default function ChildTimer() {
  const { state, dispatch } = useApp()
  const { timerState, currentUser } = state
  const [selected, setSelected] = useState('')
  // ストップウォッチ（のんびり計る）か、タイマー（時間をきめてカウントダウン）か
  const [kind, setKind] = useState<'stopwatch' | 'countdown'>('stopwatch')
  const [minutes, setMinutes] = useState(15)
  const [doneMessage, setDoneMessage] = useState('')

  const target = timerState.isRunning ? timerState.targetSeconds : 0

  // カウントダウンが0になったら、自動で止めて「きろくする」画面を出す（終了のお知らせは TimerAlertManager が出す）
  useEffect(() => {
    if (!currentUser || !timerState.isRunning || target <= 0 || timerState.elapsed < target) return
    if (timerState.sessionUserId !== currentUser.id) return
    dispatch({ type: 'STOP_TIMER' })
  }, [timerState.isRunning, timerState.elapsed, target])

  if (!currentUser) return null

  // 止めたあと、まだ保存も破棄もしていない（アプリを閉じて開き直したときも、ここから続けられる）
  const pending = !timerState.isRunning && timerState.sessionUserId === currentUser.id && timerState.elapsed >= MIN_SAVE_SECONDS
  const pendingDuration = timerState.targetSeconds > 0 ? Math.min(timerState.elapsed, timerState.targetSeconds) : timerState.elapsed

  // 科目が消された／未選択のときは先頭の科目
  const selectedSubject = state.subjects.some(s => s.name === selected) ? selected : (state.subjects[0]?.name ?? '')

  const mySessions = state.studySessions.filter(s => s.userId === currentUser.id)
  const totalTime = getTotalStudyTime(mySessions)
  const streak = getStreak(mySessions)

  const handleStart = () => {
    setDoneMessage('')
    dispatch({
      type: 'START_TIMER',
      payload: { subject: selectedSubject, userId: currentUser.id, now: Date.now(), targetSeconds: kind === 'countdown' ? minutes * 60 : 0 },
    })
  }

  const handleStop = () => {
    // 止めた瞬間の正確な秒数にそろえてから止める。5秒に満たないときは記録しない
    dispatch({ type: 'TICK_TIMER', payload: { now: Date.now() } })
    const seconds = timerState.pausedAt > 0
      ? timerState.elapsed
      : Math.floor((Date.now() - timerState.startedAt - timerState.pausedMs) / 1000)
    if (seconds < MIN_SAVE_SECONDS) { dispatch({ type: 'RESET_TIMER' }); return }
    dispatch({ type: 'STOP_TIMER' })
  }

  const saveRecord = (note?: string, photo?: string) => {
    dispatch({
      type: 'SAVE_SESSION',
      payload: { id: `s-${Date.now()}`, userId: currentUser.id, subject: timerState.subject, duration: pendingDuration, date: getTodayStr(), note, photo },
    })
    setDoneMessage(`🎉 ${timerState.subject} ${Math.max(Math.round(pendingDuration / 60), 1)}分、がんばったね！`)
  }

  const paused = timerState.isRunning && timerState.pausedAt > 0
  const color = getSubjectColor(state.subjects, timerState.isRunning ? timerState.subject : selectedSubject)
  const isCountdown = timerState.isRunning ? target > 0 : kind === 'countdown'
  const clockText = isCountdown
    ? formatClock(Math.max((timerState.isRunning ? target - timerState.elapsed : minutes * 60), 0))
    : formatDuration(timerState.elapsed)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>⏱️ 学習タイマー</Text>

        {!!doneMessage && !timerState.isRunning && (
          <View style={styles.doneCard}>
            <Text style={styles.doneText}>{doneMessage}</Text>
          </View>
        )}

        {/* Subject selector */}
        {!timerState.isRunning && (
          <View style={styles.card}>
            <View style={styles.kindRow}>
              {([['stopwatch', 'ストップウォッチ'], ['countdown', 'タイマー']] as ['stopwatch' | 'countdown', string][]).map(([k, label]) => (
                <TouchableOpacity key={k} onPress={() => setKind(k)} style={[styles.kindBtn, kind === k && styles.kindOn]}>
                  <Text style={[styles.kindText, kind === k && styles.kindTextOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {kind === 'countdown' && (
              <>
                <Text style={styles.sectionLabel}>なん分やる？</Text>
                <View style={styles.subjectRow}>
                  {TIMER_PRESETS.map(p => (
                    <TouchableOpacity key={p} onPress={() => setMinutes(p)} style={[styles.subjectBtn, { backgroundColor: minutes === p ? '#4fcf8e' : '#f1f5f9' }]}>
                      <Text style={[styles.subjectText, { color: minutes === p ? 'white' : '#64748b' }]}>{p}分</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
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
            <Text style={styles.studyingLabel}>📖 {timerState.subject}{paused ? '（一時停止中）' : 'を勉強中'}</Text>
          )}
          <View style={[styles.timerCircle, { borderColor: color }]}>
            <Text style={[styles.timerText, { color }]}>{clockText}</Text>
          </View>
          {timerState.isRunning && (
            <TouchableOpacity
              onPress={() => dispatch({ type: paused ? 'RESUME_TIMER' : 'PAUSE_TIMER', payload: { now: Date.now() } })}
              style={[styles.timerBtn, { backgroundColor: paused ? color : '#f1f5f9' }]}
            >
              <Text style={[styles.timerBtnText, { color: paused ? 'white' : '#64748b' }]}>{paused ? '▶ つづける' : '⏸ 一時停止'}</Text>
            </TouchableOpacity>
          )}
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

        <RecentNotes sessions={mySessions} subjects={state.subjects} limit={3} title="📝 さいきんのがんばり" />
      </ScrollView>

      <FinishRecordModal
        visible={pending}
        subject={timerState.subject}
        duration={pendingDuration}
        onSave={saveRecord}
        onDiscard={() => dispatch({ type: 'RESET_TIMER' })}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1a202c' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  timerCard: { alignItems: 'center', gap: 16 },
  sectionLabel: { fontSize: 13, color: '#64748b', marginBottom: 12, marginTop: 12 },
  kindRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 14 },
  kindBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  kindOn: { backgroundColor: 'white' },
  kindText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  kindTextOn: { color: '#1a202c', fontWeight: '700' },
  doneCard: { backgroundColor: '#e8fef3', borderRadius: 16, padding: 16, alignItems: 'center' },
  doneText: { color: '#1e8e5a', fontSize: 15, fontWeight: '700' },
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
