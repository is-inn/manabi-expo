import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { useApp } from '../hooks/AppContext'
import SubjectForm from './SubjectForm'
import ConfirmModal from './ConfirmModal'
import { makeId } from '../utils/helpers'
import { SUBJECT_PALETTE, SUBJECT_PRESETS } from '../utils/defaults'
import { Subject } from '../types'

type Preset = (typeof SUBJECT_PRESETS)[number]

/** 科目の追加・編集・削除。家族モードの設定とひとりモードの設定で共用する */
export default function SubjectsSection() {
  const { state, dispatch } = useApp()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Subject | null>(null)

  const [presetOpen, setPresetOpen] = useState(false)
  const [preview, setPreview] = useState<Preset | null>(null)
  const [replaceTarget, setReplaceTarget] = useState<Preset | null>(null)

  const names = state.subjects.map(s => s.name)

  /** セットの科目を、使われていない色から順に割り当てて追加する（同名はスキップ） */
  const toSubjects = (p: Preset, taken: string[]): Subject[] => {
    const colors = [...taken]
    return p.subjects.map(name => {
      const color = SUBJECT_PALETTE.find(c => !colors.includes(c)) ?? SUBJECT_PALETTE[colors.length % SUBJECT_PALETTE.length]
      colors.push(color)
      return { id: makeId('sub'), name, color }
    })
  }
  const applyPreset = (p: Preset) => {
    dispatch({ type: 'ADD_SUBJECTS', payload: toSubjects(p, state.subjects.map(s => s.color)) })
    setPreview(null)
  }
  // 置き換え: 先にセットを足してから、セットに無い科目を消す（最後の1つは消せない仕組みを避けるため）
  const replacePreset = (p: Preset) => {
    const keep = state.subjects.filter(s => p.subjects.includes(s.name))
    dispatch({ type: 'ADD_SUBJECTS', payload: toSubjects(p, keep.map(s => s.color)) })
    state.subjects.filter(s => !p.subjects.includes(s.name)).forEach(s => dispatch({ type: 'DELETE_SUBJECT', payload: s.id }))
    setPreview(null)
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>科目</Text>
        <TouchableOpacity onPress={() => { setAdding(!adding); setEditingId(null) }} style={styles.addBtn}>
          <Text style={styles.addBtnText}>{adding ? 'キャンセル' : '＋ 追加'}</Text>
        </TouchableOpacity>
      </View>

      {adding && (
        <SubjectForm
          existingNames={names}
          usedColors={state.subjects.map(s => s.color)}
          submitLabel="追加する"
          onSubmit={v => dispatch({ type: 'ADD_SUBJECT', payload: { id: makeId('sub'), name: v.name, color: v.color } })}
        />
      )}

      {state.subjects.map(s => editingId === s.id ? (
        <SubjectForm
          key={s.id}
          initial={{ name: s.name, color: s.color }}
          existingNames={names.filter(n => n !== s.name)}
          submitLabel="保存"
          onSubmit={v => { dispatch({ type: 'UPDATE_SUBJECT', payload: { id: s.id, name: v.name, color: v.color } }); setEditingId(null) }}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <View key={s.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: s.color }]} />
          <Text style={styles.name}>{s.name}</Text>
          <TouchableOpacity onPress={() => { setEditingId(s.id); setAdding(false) }} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>編集</Text>
          </TouchableOpacity>
          {state.subjects.length > 1 && (
            <TouchableOpacity onPress={() => setPendingDelete(s)}>
              <Text style={styles.deleteBtn}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <View style={styles.presetCard}>
        <TouchableOpacity onPress={() => { setPresetOpen(!presetOpen); setPreview(null) }}>
          <Text style={styles.presetToggle}>{presetOpen ? '▲ セットをとじる' : '📚 セットから追加（中学・高校・受験）'}</Text>
        </TouchableOpacity>
        {presetOpen && (
          <>
            <View style={styles.chips}>
              {SUBJECT_PRESETS.map(p => (
                <TouchableOpacity key={p.id} onPress={() => setPreview(p)} style={[styles.chip, preview?.id === p.id && styles.chipOn]}>
                  <Text style={[styles.chipText, preview?.id === p.id && styles.chipTextOn]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {preview && (
              <View style={styles.preview}>
                <Text style={styles.previewText}>{preview.subjects.join('・')}</Text>
                <Text style={styles.note}>
                  新しく入るのは {preview.subjects.filter(n => !names.includes(n)).length} 科目です（同じ名前の科目はそのまま）。
                </Text>
                <TouchableOpacity onPress={() => applyPreset(preview)} style={styles.applyBtn}>
                  <Text style={styles.applyText}>追加する</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReplaceTarget(preview)}>
                  <Text style={styles.replaceText}>いまの科目をこのセットに置き換える</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <Text style={styles.note}>科目の名前を変えると、これまでのタスクや学習記録の科目名も一緒に変わります。</Text>

      <ConfirmModal
        visible={replaceTarget !== null}
        title={`「${replaceTarget?.label ?? ''}」に置き換えますか？`}
        message="いまの科目のうち、セットにないものは削除されます。これまでの学習記録は残りますが、その科目の色はグレーになります。"
        onConfirm={() => { if (replaceTarget) replacePreset(replaceTarget); setReplaceTarget(null) }}
        onCancel={() => setReplaceTarget(null)}
      />

      <ConfirmModal
        visible={pendingDelete !== null}
        title={`「${pendingDelete?.name ?? ''}」を削除しますか？`}
        message="これまでの学習記録は残りますが、科目の色はグレーになります。"
        onConfirm={() => { if (pendingDelete) dispatch({ type: 'DELETE_SUBJECT', payload: pendingDelete.id }); setPendingDelete(null) }}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  addBtn: { backgroundColor: '#4f9cf9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  row: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  smallBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  deleteBtn: { fontSize: 22, color: '#cbd5e1', paddingHorizontal: 4 },
  note: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
  presetCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, gap: 10 },
  presetToggle: { fontSize: 13, fontWeight: '700', color: '#4f9cf9' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  chipOn: { backgroundColor: '#4f9cf9' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextOn: { color: 'white' },
  preview: { gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 },
  previewText: { fontSize: 13, color: '#1a202c', lineHeight: 20 },
  applyBtn: { backgroundColor: '#4f9cf9', padding: 10, borderRadius: 10, alignItems: 'center' },
  applyText: { color: 'white', fontWeight: '700', fontSize: 13 },
  replaceText: { textAlign: 'center', fontSize: 12, color: '#94a3b8' },
})
