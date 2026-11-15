import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import { useApp } from '../hooks/AppContext'
import { ensureReminderPermission } from '../services/reminders'
import { playTimerEndAlert } from '../services/timerAlert'
import { TimerAlertSetting } from '../types'

const SOUND_OPTIONS: [TimerAlertSetting['sound'], string, string][] = [
  ['vibrate', '📳 バイブだけ', 'ブブッと短くふるえます'],
  ['vibrateSound', '🔔 バイブ＋やわらかい音', 'ポポン、と小さく鳴ります'],
]
const NOTIFY_OPTIONS: [boolean, string, string][] = [
  [false, '📱 アプリの中だけ', 'アプリを開いているときに知らせます'],
  [true, '🔔 通知でも知らせる', '画面を閉じていても通知が届きます'],
]

/** タイマーが終わったときの知らせ方（この端末だけ） */
export default function TimerAlertSettings() {
  const { state, dispatch } = useApp()
  const a = state.timerAlert
  const set = (patch: Partial<TimerAlertSetting>) => dispatch({ type: 'SET_TIMER_ALERT', payload: { ...a, ...patch } })

  const setNotify = async (on: boolean) => {
    if (!on || Platform.OS === 'web') return set({ notify: on })
    if (await ensureReminderPermission()) return set({ notify: true })
    Alert.alert('通知がオフになっています', '端末の「設定」アプリで、まなびチームの通知を許可してください。')
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>⏰ タイマーのおわりの知らせ方</Text>
      <Text style={styles.hint}>タイマーが0になったときに、うるさくない方法で知らせます。</Text>

      <Text style={styles.label}>鳴り方</Text>
      {SOUND_OPTIONS.map(([v, label, desc]) => (
        <TouchableOpacity key={v} onPress={() => set({ sound: v })} style={[styles.option, a.sound === v && styles.optionOn]}>
          <Text style={[styles.optionLabel, a.sound === v && styles.optionLabelOn]}>{a.sound === v ? '● ' : '○ '}{label}</Text>
          <Text style={styles.optionDesc}>{desc}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>知らせ方</Text>
      {NOTIFY_OPTIONS.map(([v, label, desc]) => (
        <TouchableOpacity key={String(v)} onPress={() => setNotify(v)} style={[styles.option, a.notify === v && styles.optionOn]}>
          <Text style={[styles.optionLabel, a.notify === v && styles.optionLabelOn]}>{a.notify === v ? '● ' : '○ '}{label}</Text>
          <Text style={styles.optionDesc}>{desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => playTimerEndAlert(a)} style={styles.testBtn}>
        <Text style={styles.testText}>▶ ためしに鳴らす</Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        ※ マナーモードのときは音は鳴らず、バイブだけになります。{'\n'}
        ※ iPhoneで画面を閉じているときの「バイブだけ」は、音なしの通知で知らせます。
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  hint: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '700', marginTop: 6 },
  option: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, gap: 2 },
  optionOn: { borderColor: '#4f9cf9', backgroundColor: '#f0f7ff' },
  optionLabel: { fontSize: 14, fontWeight: '700', color: '#475569' },
  optionLabelOn: { color: '#1d6fd8' },
  optionDesc: { fontSize: 11, color: '#94a3b8', marginLeft: 16 },
  testBtn: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  testText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  note: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
})
