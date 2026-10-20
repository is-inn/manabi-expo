import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { useApp } from '../hooks/AppContext'
import SubjectForm from './SubjectForm'
import ConfirmModal from './ConfirmModal'
import { makeId } from '../utils/helpers'
import { Subject } from '../types'

/** 科目の追加・編集・削除。家族モードの設定とひとりモードの設定で共用する */
export default function SubjectsSection() {
  const { state, dispatch } = useApp()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Subject | null>(null)

  const names = state.subjects.map(s => s.name)

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
      <Text style={styles.note}>科目の名前を変えると、これまでのタスクや学習記録の科目名も一緒に変わります。</Text>

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
})
