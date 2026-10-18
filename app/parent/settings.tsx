import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import { useState } from 'react'
import { useApp } from '../../src/hooks/AppContext'
import MemberForm from '../../src/components/MemberForm'
import SubjectForm from '../../src/components/SubjectForm'
import ConfirmModal from '../../src/components/ConfirmModal'
import { makeId } from '../../src/utils/helpers'
import { User, Subject } from '../../src/types'

export default function ParentSettings() {
  const { state, dispatch } = useApp()
  const [addingUser, setAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [addingSubject, setAddingSubject] = useState(false)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null)

  const names = state.subjects.map(s => s.name)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>⚙️ 設定</Text>

        {/* ---- ご家族 ---- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ご家族</Text>
          <TouchableOpacity onPress={() => { setAddingUser(!addingUser); setEditingUserId(null) }} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{addingUser ? 'キャンセル' : '＋ 追加'}</Text>
          </TouchableOpacity>
        </View>

        {addingUser && (
          <MemberForm
            defaultRole="child"
            submitLabel="追加する"
            onSubmit={v => dispatch({ type: 'ADD_USER', payload: { id: makeId('u'), name: v.name, avatar: v.avatar, role: v.role } })}
          />
        )}

        {state.users.map(u => editingUserId === u.id ? (
          <MemberForm
            key={u.id}
            initial={{ name: u.name, avatar: u.avatar, role: u.role }}
            lockRole
            submitLabel="保存"
            onSubmit={v => { dispatch({ type: 'UPDATE_USER', payload: { id: u.id, name: v.name, avatar: v.avatar } }); setEditingUserId(null) }}
            onCancel={() => setEditingUserId(null)}
          />
        ) : (
          <View key={u.id} style={styles.row}>
            <Text style={styles.avatar}>{u.avatar}</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{u.name}</Text>
              <Text style={styles.rowSub}>{u.role === 'parent' ? '保護者' : 'こども'}</Text>
            </View>
            <TouchableOpacity onPress={() => { setEditingUserId(u.id); setAddingUser(false) }} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>編集</Text>
            </TouchableOpacity>
            {/* ログイン中の本人は消せない（保護者が0人になるのを防ぐ） */}
            {u.id !== state.currentUser?.id && (
              <TouchableOpacity onPress={() => setDeleteUser(u)}>
                <Text style={styles.deleteBtn}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* ---- 科目 ---- */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>科目</Text>
          <TouchableOpacity onPress={() => { setAddingSubject(!addingSubject); setEditingSubjectId(null) }} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{addingSubject ? 'キャンセル' : '＋ 追加'}</Text>
          </TouchableOpacity>
        </View>

        {addingSubject && (
          <SubjectForm
            existingNames={names}
            usedColors={state.subjects.map(s => s.color)}
            submitLabel="追加する"
            onSubmit={v => dispatch({ type: 'ADD_SUBJECT', payload: { id: makeId('sub'), name: v.name, color: v.color } })}
          />
        )}

        {state.subjects.map(s => editingSubjectId === s.id ? (
          <SubjectForm
            key={s.id}
            initial={{ name: s.name, color: s.color }}
            existingNames={names.filter(n => n !== s.name)}
            submitLabel="保存"
            onSubmit={v => { dispatch({ type: 'UPDATE_SUBJECT', payload: { id: s.id, name: v.name, color: v.color } }); setEditingSubjectId(null) }}
            onCancel={() => setEditingSubjectId(null)}
          />
        ) : (
          <View key={s.id} style={styles.row}>
            <View style={[styles.colorDot, { backgroundColor: s.color }]} />
            <Text style={[styles.rowName, styles.rowInfo]}>{s.name}</Text>
            <TouchableOpacity onPress={() => { setEditingSubjectId(s.id); setAddingSubject(false) }} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>編集</Text>
            </TouchableOpacity>
            {state.subjects.length > 1 && (
              <TouchableOpacity onPress={() => setDeleteSubject(s)}>
                <Text style={styles.deleteBtn}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <Text style={styles.note}>科目の名前を変えると、これまでのタスクや学習記録の科目名も一緒に変わります。</Text>
      </ScrollView>

      <ConfirmModal
        visible={deleteUser !== null}
        title={`${deleteUser?.name ?? ''}さんを削除しますか？`}
        message={deleteUser?.role === 'child'
          ? 'この人のタスクと学習記録もすべて消えます。元に戻せません。'
          : 'この保護者を削除します。元に戻せません。'}
        onConfirm={() => { if (deleteUser) dispatch({ type: 'DELETE_USER', payload: deleteUser.id }); setDeleteUser(null) }}
        onCancel={() => setDeleteUser(null)}
      />
      <ConfirmModal
        visible={deleteSubject !== null}
        title={`「${deleteSubject?.name ?? ''}」を削除しますか？`}
        message="これまでの学習記録は残りますが、科目の色はグレーになります。"
        onConfirm={() => { if (deleteSubject) dispatch({ type: 'DELETE_SUBJECT', payload: deleteSubject.id }); setDeleteSubject(null) }}
        onCancel={() => setDeleteSubject(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 12 },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  addBtn: { backgroundColor: '#4f9cf9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  row: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  avatar: { fontSize: 28 },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  smallBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  deleteBtn: { fontSize: 22, color: '#cbd5e1', paddingHorizontal: 4 },
  note: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
})
