import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { useApp } from '../hooks/AppContext'
import GoalStepper from './GoalStepper'
import { DEFAULT_WEEKLY_GOAL_MINUTES, MAX_GOAL_TITLE_LENGTH, MAX_WEEKLY_GOAL_MINUTES } from '../utils/defaults'
import { formatDuration, getDaysUntil, getTotalStudyTime, getWeekSessions, toDateStr } from '../utils/helpers'

/** 保護者の週の目標カード（今週の時間・達成率・期限までの日数）。編集もここで行う */
export default function ParentGoalCard({ userId }: { userId: string }) {
  const { state, dispatch } = useApp()
  const goal = state.goals.find(g => g.userId === userId)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(DEFAULT_WEEKLY_GOAL_MINUTES)
  const [deadline, setDeadline] = useState('')

  const weekSeconds = getTotalStudyTime(getWeekSessions(state.studySessions.filter(s => s.userId === userId)))

  const startEdit = () => {
    setTitle(goal?.title ?? '')
    setMinutes(goal?.weeklyMinutes ?? DEFAULT_WEEKLY_GOAL_MINUTES)
    setDeadline(goal?.deadline ?? '')
    setEditing(true)
  }

  // 日付は YYYY-MM-DD の実在する日だけ受け付ける
  const deadlineOk = deadline === '' || (/^\d{4}-\d{2}-\d{2}$/.test(deadline) && (() => {
    const [y, m, d] = deadline.split('-').map(Number)
    return toDateStr(new Date(y, m - 1, d)) === deadline
  })())

  const save = () => {
    if (!deadlineOk) return
    dispatch({
      type: 'SET_GOAL',
      payload: {
        userId,
        weeklyMinutes: minutes,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(deadline ? { deadline } : {}),
      },
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 目標をきめる</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="目標の名前（例：資格試験）"
          maxLength={MAX_GOAL_TITLE_LENGTH}
          style={styles.input}
        />
        <Text style={styles.label}>1週間の目標</Text>
        <GoalStepper minutes={minutes} max={MAX_WEEKLY_GOAL_MINUTES} step={30} onChange={setMinutes} />
        <Text style={styles.label}>期限（あれば）</Text>
        <TextInput
          value={deadline}
          onChangeText={setDeadline}
          placeholder="2026-12-31"
          maxLength={10}
          keyboardType="numbers-and-punctuation"
          style={[styles.input, !deadlineOk && styles.inputError]}
        />
        {!deadlineOk && <Text style={styles.error}>「2026-12-31」の形で入れてください</Text>}
        <View style={styles.btnRow}>
          <TouchableOpacity onPress={() => setEditing(false)} style={[styles.btn, styles.cancel]}>
            <Text style={styles.cancelText}>やめる</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} disabled={!deadlineOk} style={[styles.btn, styles.submit, !deadlineOk && styles.disabled]}>
            <Text style={styles.submitText}>保存</Text>
          </TouchableOpacity>
        </View>
        {goal && (
          <TouchableOpacity onPress={() => { dispatch({ type: 'DELETE_GOAL', payload: userId }); setEditing(false) }}>
            <Text style={styles.remove}>目標をやめる</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  if (!goal) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 週の目標</Text>
        <Text style={styles.empty}>まだ目標がありません。1週間でどれくらい勉強するか決めておくと、進み具合が見えます。</Text>
        <TouchableOpacity onPress={startEdit} style={[styles.btn, styles.submit]}>
          <Text style={styles.submitText}>目標をきめる</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const goalSeconds = goal.weeklyMinutes * 60
  const percent = Math.round((weekSeconds / goalSeconds) * 100)
  const days = goal.deadline ? getDaysUntil(goal.deadline) : null

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.cardTitle}>🎯 {goal.title || '週の目標'}</Text>
        <TouchableOpacity onPress={startEdit} style={styles.editBtn}>
          <Text style={styles.editText}>編集</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${Math.min(percent, 100)}%` }]} />
      </View>
      <Text style={styles.percent}>{percent}%{percent >= 100 ? '　達成！🎉' : ''}</Text>
      <Text style={styles.detail}>今週 {formatDuration(weekSeconds)} / 目標 {formatDuration(goalSeconds)}</Text>
      {days !== null && (
        <Text style={styles.detail}>
          {days > 0 ? `期限まであと${days}日（${goal.deadline}）` : days === 0 ? '期限は今日です' : `期限を${-days}日すぎました（${goal.deadline}）`}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a202c' },
  editBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  empty: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  bar: { height: 12, borderRadius: 6, backgroundColor: '#e8f3fe', overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6, backgroundColor: '#4f9cf9' },
  percent: { fontSize: 22, fontWeight: '700', color: '#4f9cf9' },
  detail: { fontSize: 12, color: '#64748b' },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14 },
  inputError: { borderColor: '#f97b4f' },
  error: { fontSize: 11, color: '#f97b4f' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#f1f5f9' },
  cancelText: { color: '#64748b', fontWeight: '700' },
  submit: { backgroundColor: '#4f9cf9' },
  submitText: { color: 'white', fontWeight: '700' },
  disabled: { opacity: 0.45 },
  remove: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 4 },
})
