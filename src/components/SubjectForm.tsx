import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { MAX_SUBJECT_LENGTH, SUBJECT_PALETTE } from '../utils/defaults'

export interface SubjectValue {
  name: string
  color: string
}

interface Props {
  initial?: SubjectValue
  /** 重複チェック用。編集中の科目自身の名前は含めない */
  existingNames: string[]
  /** 新規追加のとき、すでに使われている色を避けて最初の色にする */
  usedColors?: string[]
  submitLabel: string
  onSubmit: (value: SubjectValue) => void
  onCancel?: () => void
}

export default function SubjectForm({ initial, existingNames, usedColors = [], submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? SUBJECT_PALETTE.find(c => !usedColors.includes(c)) ?? SUBJECT_PALETTE[0])
  const trimmed = name.trim()
  const duplicated = trimmed.length > 0 && existingNames.includes(trimmed)
  const canSubmit = trimmed.length > 0 && !duplicated

  const submit = () => {
    if (!canSubmit) return
    onSubmit({ name: trimmed, color })
    if (!initial) setName('')
  }

  return (
    <View style={styles.card}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="科目名（例：ピアノ）"
        maxLength={MAX_SUBJECT_LENGTH}
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {duplicated && <Text style={styles.error}>同じ名前の科目があります</Text>}

      <Text style={styles.label}>色</Text>
      <View style={styles.row}>
        {SUBJECT_PALETTE.map(c => (
          <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.dotWrap, color === c && styles.dotWrapOn]}>
            <View style={[styles.dot, { backgroundColor: c }]} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.btnRow}>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={[styles.btn, styles.cancel]}>
            <Text style={styles.cancelText}>やめる</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={submit} disabled={!canSubmit} style={[styles.btn, styles.submit, !canSubmit && styles.disabled]}>
          <Text style={styles.submitText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14 },
  error: { color: '#ef4444', fontSize: 12 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dotWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  dotWrapOn: { borderColor: '#1a202c' },
  dot: { width: 24, height: 24, borderRadius: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#f1f5f9' },
  cancelText: { color: '#64748b', fontWeight: '700' },
  submit: { backgroundColor: '#4f9cf9' },
  submitText: { color: 'white', fontWeight: '700' },
  disabled: { opacity: 0.45 },
})
