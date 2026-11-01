import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MAX_GOAL_MINUTES } from '../utils/defaults'

interface Props {
  minutes: number
  onChange: (minutes: number) => void
  /** 上限（分）。省略すると1日の目標の上限 */
  max?: number
  /** 1回に動かす幅（分）。省略すると5分 */
  step?: number
}

/** 目標（分）を ± で変える。刻みは step 分、1分〜max分 */
export default function GoalStepper({ minutes, onChange, max = MAX_GOAL_MINUTES, step: unit = 5 }: Props) {
  const clamp = (n: number) => Math.min(Math.max(n, 1), max)
  const step = (delta: number) => {
    // 刻みに揃えてから動かす（1分や7分のような端数からも自然に動く）
    const base = delta > 0 ? Math.floor(minutes / unit) * unit : Math.ceil(minutes / unit) * unit
    onChange(clamp(base + delta))
  }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const label = h > 0 ? (m > 0 ? `${h}時間${m}分` : `${h}時間`) : `${m}分`

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => step(-unit)} style={styles.btn}>
        <Text style={styles.btnText}>－</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{label}</Text>
      <TouchableOpacity onPress={() => step(unit)} style={styles.btn}>
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
