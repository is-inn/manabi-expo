import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, SafeAreaView, Modal } from 'react-native'
import { useEffect, useState } from 'react'
import { useApp } from '../../src/hooks/AppContext'
import GoalStepper from '../../src/components/GoalStepper'
import { SOLO_USER_ID, TIMER_PRESETS } from '../../src/utils/defaults'
import { formatClock, formatDuration, getDailyTotals, getSubjectColor, getTodayStr, makeId } from '../../src/utils/helpers'

type Kind = 'stopwatch' | 'countdown'
const MIN_SAVE_SECONDS = 5
const MAX_NOTE_LENGTH = 200

export default function SoloTimer() {
  const { state, dispatch } = useApp()
  const { timerState } = state
  const [kind, setKind] = useState<Kind>('stopwatch')
  const [minutes, setMinutes] = useState(25)
  const [selected, setSelected] = useState('')
  const [finishOpen, setFinishOpen] = useState(false)
  const [note, setNote] = useState('')

  // 科目が消された／未選択のときは先頭の科目
  const subjectName = state.subjects.some(s => s.name === selected) ? selected : (state.subjects[0]?.name ?? '')

  const mine = timerState.sessionUserId === SOLO_USER_ID
  const running = timerState.isRunning && mine
  // 止めたあと、まだ保存も破棄もしていない状態
  const pending = !timerState.isRunning && mine && timerState.elapsed > 0
  const target = mine ? timerState.targetSeconds : 0
  const isCountdown = (running || pending) ? target > 0 : kind === 'countdown'
  const duration = target > 0 ? Math.min(timerState.elapsed, target) : timerState.elapsed
  const shownSubject = (running || pending) ? timerState.subject : subjectName
  const color = getSubjectColor(state.subjects, shownSubject)

  // カウントダウンが0になったら自動で止めて、保存画面を出す
  useEffect(() => {
    if (running && target > 0 && timerState.elapsed >= target) {
      dispatch({ type: 'STOP_TIMER' })
      setFinishOpen(true)
    }
  }, [running, target, timerState.elapsed])

  const start = () => {
    if (!subjectName) return
    setNote('')
    dispatch({
      type: 'START_TIMER',
      payload: { subject: subjectName, userId: SOLO_USER_ID, now: Date.now(), targetSeconds: kind === 'countdown' ? minutes * 60 : 0 },
    })
  }

  const stop = () => {
    // 止めた瞬間の正確な秒数にそろえてから止める
    dispatch({ type: 'TICK_TIMER', payload: { now: Date.now() } })
    dispatch({ type: 'STOP_TIMER' })
    const seconds = Math.floor((Date.now() - timerState.startedAt) / 1000)
    if (seconds < MIN_SAVE_SECONDS) dispatch({ type: 'RESET_TIMER' })
    else setFinishOpen(true)
  }

  const save = () => {
    dispatch({
      type: 'SAVE_SESSION',
      payload: {
        id: makeId('s'),
        userId: SOLO_USER_ID,
        subject: timerState.subject,
        duration,
        date: getTodayStr(),
        note: note.trim() || undefined,
      },
    })
    setFinishOpen(false)
    setNote('')
  }

  const discard = () => {
    dispatch({ type: 'RESET_TIMER' })
    setFinishOpen(false)
    setNote('')
  }

  const sessions = state.studySessions.filter(s => s.userId === SOLO_USER_ID)
  const todayTotal = getDailyTotals(sessions)[getTodayStr()] ?? 0
  const display = isCountdown ? Math.max(target > 0 ? target - timerState.elapsed : minutes * 60, 0) : timerState.elapsed
  const idle = !running && !pending

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>⏱️ 勉強をけいそく</Text>

        {idle && (
          <View style={styles.card}>
            <View style={styles.kindRow}>
              {([['stopwatch', 'ストップウォッチ'], ['countdown', 'タイマー']] as [Kind, string][]).map(([k, label]) => (
                <TouchableOpacity key={k} onPress={() => setKind(k)} style={[styles.kindBtn, kind === k && styles.kindOn]}>
                  <Text style={[styles.kindText, kind === k && styles.kindTextOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {kind === 'countdown' && (
              <>
                <View style={styles.row}>
                  {TIMER_PRESETS.map(p => (
                    <TouchableOpacity key={p} onPress={() => setMinutes(p)} style={[styles.chip, minutes === p && styles.chipOn]}>
                      <Text style={[styles.chipText, minutes === p && styles.chipTextOn]}>{p}分</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <GoalStepper minutes={minutes} onChange={setMinutes} />
              </>
            )}

            <Text style={styles.sectionLabel}>科目を選んでね</Text>
            <View style={styles.row}>
              {state.subjects.map(s => (
                <TouchableOpacity key={s.id} onPress={() => setSelected(s.name)}
                  style={[styles.chip, { backgroundColor: subjectName === s.name ? s.color : '#f1f5f9' }]}>
                  <Text style={[styles.chipText, { color: subjectName === s.name ? 'white' : '#64748b' }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.card, styles.timerCard]}>
          <Text style={styles.studyingLabel}>
            {idle ? (isCountdown ? `${minutes}分のタイマー` : 'ストップウォッチ') : `📖 ${timerState.subject}${running ? 'を勉強中' : '（おわり）'}`}
          </Text>
          <View style={[styles.circle, { borderColor: color }]}>
            <Text style={[styles.clock, { color }]}>{formatClock(display)}</Text>
          </View>
          {running ? (
            <TouchableOpacity onPress={stop} style={[styles.mainBtn, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.mainBtnText, { color: '#ef4444' }]}>⏹ おわる</Text>
            </TouchableOpacity>
          ) : pending ? (
            <TouchableOpacity onPress={() => setFinishOpen(true)} style={[styles.mainBtn, { backgroundColor: color }]}>
              <Text style={[styles.mainBtnText, { color: 'white' }]}>きろくする</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={start} style={[styles.mainBtn, { backgroundColor: color }]}>
              <Text style={[styles.mainBtnText, { color: 'white' }]}>▶ はじめる</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>今日の合計</Text>
          <Text style={styles.todayValue}>{formatDuration(todayTotal)}</Text>
        </View>
      </ScrollView>

      <Modal visible={finishOpen} transparent animationType="fade" onRequestClose={() => setFinishOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>おつかれさま！🎉</Text>
            <Text style={styles.modalSummary}>{timerState.subject}　{formatDuration(duration)}</Text>
            <Text style={styles.sectionLabel}>がんばったこと（なくてもOK）</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="例：英単語を30個おぼえた"
              maxLength={MAX_NOTE_LENGTH}
              multiline
              style={[styles.input, styles.noteInput]}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity onPress={discard} style={[styles.modalBtn, styles.discard]}>
                <Text style={styles.discardText}>きろくしない</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} style={[styles.modalBtn, styles.save]}>
                <Text style={styles.saveText}>きろくする</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1a202c' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  kindRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
  kindBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  kindOn: { backgroundColor: 'white' },
  kindText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  kindTextOn: { color: '#1a202c', fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  chipOn: { backgroundColor: '#4fcf8e' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextOn: { color: 'white' },
  sectionLabel: { fontSize: 13, color: '#64748b' },
  timerCard: { alignItems: 'center', gap: 16 },
  studyingLabel: { fontSize: 13, color: '#64748b' },
  circle: { width: 190, height: 190, borderRadius: 95, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  clock: { fontSize: 38, fontWeight: '700' },
  mainBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 50 },
  mainBtnText: { fontSize: 16, fontWeight: '700' },
  todayCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center' },
  todayLabel: { fontSize: 12, color: '#64748b' },
  todayValue: { fontSize: 22, fontWeight: '700', color: '#4f9cf9', marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, gap: 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a202c', textAlign: 'center' },
  modalSummary: { fontSize: 16, fontWeight: '700', color: '#4f9cf9', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14 },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  discard: { backgroundColor: '#f1f5f9' },
  discardText: { color: '#64748b', fontWeight: '700' },
  save: { backgroundColor: '#4fcf8e' },
  saveText: { color: 'white', fontWeight: '700' },
})
