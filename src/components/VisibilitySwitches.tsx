import { View, Text, Switch, StyleSheet } from 'react-native'
import { ParentVisibility } from '../types'
import { VISIBILITY_ITEMS } from '../utils/defaults'

interface Props {
  value: ParentVisibility
  onChange: (value: ParentVisibility) => void
}

/** 保護者の学習状況を、子どもにどこまで見せるか（6項目のスイッチ） */
export default function VisibilitySwitches({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {VISIBILITY_ITEMS.map(item => (
        <View key={item.key} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
          <Switch
            value={value[item.key]}
            onValueChange={v => onChange({ ...value, [item.key]: v })}
            trackColor={{ true: '#4f9cf9', false: '#e2e8f0' }}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#1a202c' },
  desc: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
})
