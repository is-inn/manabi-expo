import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MAX_GOAL_MINUTES } from '../utils/defaults'

interface Props {
  minutes: number
  onChange: (minutes: number) => void
}

/** 1日の目標（分）を ± で変える。5分刻み、1分〜MAX_GOAL_MINUTES分 */
export default function GoalStepper({ minutes, onChange }: Props) {
  const clamp = (n: number) => Math.min(Math.max(n, 1), MAX_GOAL_MINUTES)
  const step = (delta: number) => {
    // 5分刻みに揃えてから動かす（1分や7分のような端数からも自然に動く）
    const base = delta > 0 ? Math.floor(minutes / 5) * 5 : Math.ceil(minutes / 5) * 5
    onChange(clamp(base + delta))
  }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const label = h > 0 ? (m > 0 ? `${h}時間${m}分` : `${h}時間`) : `${m}分`

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => step(-5)} style={styles.btn}>
        <Text style={styles.btnText}>－</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{label}</Text>
      <TouchableOpacity onPress={() => step(5)} style={styles.btn}>
        <Text style={styles.btnText}>＋</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  btn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8f3fe', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 22, fontWeight: '700', color: '#4f9cf9' },
  value: { fontSize: 24, fontWeight: '700', color: '#1a202c', minWidth: 110, textAlign: 'center' },
})
