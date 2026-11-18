import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Switch } from 'react-native'
import { useApp } from '../hooks/AppContext'
import { ensureReminderPermission } from '../services/reminders'

/** こどもが勉強したとき、この端末（保護者）に通知を受け取る設定 */
export default function CheerSettings() {
  const { state, dispatch } = useApp()
  const connected = !!state.family

  const toggle = async (on: boolean) => {
    if (!on) return dispatch({ type: 'SET_CHEER_NOTIFY', payload: false })
    if (Platform.OS === 'web') return dispatch({ type: 'SET_CHEER_NOTIFY', payload: true })
    if (await ensureReminderPermission()) return dispatch({ type: 'SET_CHEER_NOTIFY', payload: true })
    Alert.alert('通知がオフになっています', '端末の「設定」アプリで、まなびチームの通知を許可してください。')
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>👏 こどもが勉強したら知らせる</Text>
        <Switch value={state.cheerNotify} onValueChange={toggle} disabled={!connected} />
      </View>
      <Text style={styles.hint}>
        こどものスマホで勉強が記録されたとき、この端末に「たろうさんが勉強したよ」と通知します。
      </Text>
      {!connected && (
        <TouchableOpacity activeOpacity={1} style={styles.notice}>
          <Text style={styles.noticeText}>「家族のスマホをつなぐ」で家族コードを作ると、使えるようになります。</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.note}>
        ※ 通知に使うため、この端末の通知用ID（個人は特定できません）を、家族だけが見られる場所に保存します。{'\n'}
        ※ オフにすると、保存したIDを消します。
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a202c', flex: 1 },
  hint: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  notice: { backgroundColor: '#fff8e8', borderRadius: 10, padding: 10 },
  noticeText: { fontSize: 12, color: '#92651a', lineHeight: 18 },
  note: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
})
