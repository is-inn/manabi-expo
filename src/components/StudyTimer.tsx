import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from '../hooks/AppContext'
import GoalStepper from './GoalStepper'
import ConfirmModal from './ConfirmModal'
import { TIMER_PRESETS } from '../utils/defaults'
import { formatClock, formatDuration, getDailyTotals, getSubjectColor, getTodayStr, makeId, toDateStr } from '../utils/helpers'
import { StudySession } from '../types'

type Kind = 'stopwatch' | 'countdown'
const MIN_SAVE_SECONDS = 5
const MAX_NOTE_LENGTH = 200

interface Props {
  /** このタイマーで記録する人のID（ひとりモード: 'solo'、保護者: その人のID） */
  userId: string
  title?: string
  /** 直近7日間の記録を下に表示する */
  showHistory?: boolean
  /** タイトルの下に差し込む表示（保護者の目標カードなど） */
  header?: ReactNode
}

/** ストップウォッチ／タイマーと、終了時の「がんばったこと」メモ。ひとりモードと保護者の「じぶんの勉強」で共通 */
export default function StudyTimer({ userId, title = '⏱️ 勉強をけいそく', showHistory = false, header }: Props) {
  const { state, dispatch } = useApp()
  const { timerState } = state
  const [kind, setKind] = useState<Kind>('stopwatch')
  const [minutes, setMinutes] = useState(25)
  const [selected, setSelected] = useState('')
  const [finishOpen, setFinishOpen] = useState(false)
  const [note, setNote] = useState('')
  const [pendingDelete, setPendingDelete] = useState<StudySession | null>(null)

  // 科目が消された／未選択のときは先頭の科目
  const subjectName = state.subjects.some(s => s.name === selected) ? selected : (state.subjects[0]?.name ?? '')

  const mine = timerState.sessionUserId === userId
  const running = timerState.isRunning && mine
  // 止めたあと、まだ保存も破棄もしていない状態
  const pending = !timerState.isRunning && mine && timerState.elapsed > 0
  // ほかの人のタイマーが動いている／記録待ちのとき、上書きして始めてしまわないようにする
  const otherBusy = !mine && (timerState.isRunning || timerState.elapsed > 0)
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
    if (!subjectName || otherBusy) return
    setNote('')
    dispatch({
      type: 'START_TIMER',
      payload: { subject: subjectName, userId, now: Date.now(), targetSeconds: kind === 'countdown' ? minutes * 60 : 0 },
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
        userId,
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

  const sessions = state.studySessions.filter(s => s.userId === userId)
  const todayTotal = getDailyTotals(sessions)[getTodayStr()] ?? 0
  const display = isCountdown ? Math.max(target > 0 ? target - timerState.elapsed : minutes * 60, 0) : timerState.elapsed
  const idle = !running && !pending

  // 直近7日間の記録（新しい日が上）
  const recentDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    recentDates.push(toDateStr(d))
  }
  const recent = showHistory ? sessions.filter(s => recentDates.includes(s.date)) : []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>{title}</Text>
        {header}

        {otherBusy && idle && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>いま、ほかの人のタイマーが動いています。{'\n'}終わってから使ってください。</Text>
          </View>
        )}

        {idle && !otherBusy && (
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

        {!(otherBusy && idle) && (
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
        )}

        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>今日の合計</Text>
          <Text style={styles.todayValue}>{formatDuration(todayTotal)}</Text>
        </View>

        {showHistory && (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>📝 直近7日間のきろく</Text>
            {recent.length === 0 && <Text style={styles.empty}>まだ記録がありません。{'\n'}上のタイマーで、勉強をはじめよう！</Text>}
            {recentDates.filter(d => recent.some(s => s.date === d)).map(date => (
              <View key={date} style={styles.dayBlock}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{date}</Text>
                  <Text style={styles.dayTotal}>{formatDuration(recent.filter(s => s.date === date).reduce((a, s) => a + s.duration, 0))}</Text>
                </View>
                {recent.filter(s => s.date === date).reverse().map(s => {
                  const c = getSubjectColor(state.subjects, s.subject)
                  return (
                    <View key={s.id} style={styles.logRow}>
                      <View style={[styles.badge, { backgroundColor: `${c}22` }]}>
                        <Text style={[styles.badgeText, { color: c }]}>{s.subject}</Text>
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
          </View>
        )}
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
  container: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1a202c' },
  notice: { backgroundColor: '#fff8e8', borderRadius: 16, padding: 20 },
  noticeText: { color: '#92651a', fontSize: 14, lineHeight: 22, textAlign: 'center' },
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
  history: { gap: 8 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, lineHeight: 22, padding: 16 },
  dayBlock: { gap: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  dayTitle: { fontSize: 13, fontWeight: '700', color: '#475569' },
  dayTotal: { fontSize: 13, color: '#64748b' },
  logRow: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, marginTop: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  rowInfo: { flex: 1, gap: 2 },
  rowTime: { fontSize: 14, fontWeight: '700', color: '#1a202c' },
  rowNote: { fontSize: 13, color: '#475569', lineHeight: 18 },
  deleteBtn: { fontSize: 22, color: '#cbd5e1', paddingHorizontal: 4 },
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
