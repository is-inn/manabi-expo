import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert, Platform } from 'react-native'
import { useApp } from '../hooks/AppContext'
import { ensureReminderPermission } from '../services/reminders'
import { ReminderSetting } from '../types'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const pad = (n: number) => String(n).padStart(2, '0')

/** 勉強のリマインド通知の設定（この端末だけ） */
export default function ReminderSettings() {
  const { state, dispatch } = useApp()
  const r = state.reminder
  const set = (patch: Partial<ReminderSetting>) => dispatch({ type: 'SET_REMINDER', payload: { ...r, ...patch } })

  const toggle = async (on: boolean) => {
    if (!on) return set({ enabled: false })
    if (Platform.OS === 'web') return
    if (await ensureReminderPermission()) return set({ enabled: true })
    Alert.alert('通知がオフになっています', '端末の「設定」アプリで、まなびチームの通知を許可してください。')
  }

  const stepMinute = (delta: number) => {
    const total = (r.hour * 60 + r.minute + delta + 1440) % 1440
    set({ hour: Math.floor(total / 60), minute: total % 60 })
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>🔔 勉強のリマインド</Text>
        <Switch value={r.enabled} onValueChange={toggle} />
      </View>
      <Text style={styles.hint}>
        決めた時間に、この端末へ通知します。その日すでに勉強していたら通知しません。
      </Text>

      {r.enabled && (
        <>
          <View style={styles.timeRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepMinute(-30)}><Text style={styles.stepText}>−30分</Text></TouchableOpacity>
            <Text style={styles.time}>{pad(r.hour)}:{pad(r.minute)}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepMinute(30)}><Text style={styles.stepText}>＋30分</Text></TouchableOpacity>
          </View>
          <View style={styles.timeRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepMinute(-5)}><Text style={styles.stepText}>−5分</Text></TouchableOpacity>
            <TouchableOpacity style={styles.stepBtn} onPress={() => stepMinute(5)}><Text style={styles.stepText}>＋5分</Text></TouchableOpacity>
          </View>
          <View style={styles.daysRow}>
            {DAY_LABELS.map((label, i) => (
              <TouchableOpacity
                key={label}
                onPress={() => set({ days: r.days.map((d, j) => (j === i ? !d : d)) })}
                style={[styles.day, r.days[i] && styles.dayOn]}
              >
                <Text style={[styles.dayText, r.days[i] && styles.dayTextOn]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!r.days.some(Boolean) && <Text style={styles.warn}>曜日を1つ以上えらんでください。</Text>}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  hint: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  timeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  time: { fontSize: 32, fontWeight: '700', color: '#4f9cf9', minWidth: 110, textAlign: 'center' },
  stepBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  stepText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  day: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9' },
  dayOn: { backgroundColor: '#4f9cf9' },
  dayText: { fontSize: 13, color: '#94a3b8', fontWeight: '700' },
  dayTextOn: { color: 'white' },
  warn: { fontSize: 12, color: '#ef4444' },
})
