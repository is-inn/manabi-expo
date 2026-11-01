import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useApp } from '../../src/hooks/AppContext'
import MemberForm from '../../src/components/MemberForm'
import SubjectsSection from '../../src/components/SubjectsSection'
import ConfirmModal from '../../src/components/ConfirmModal'
import Avatar from '../../src/components/Avatar'
import VisibilitySwitches from '../../src/components/VisibilitySwitches'
import { ALL_PRIVATE } from '../../src/utils/defaults'
import { makeId } from '../../src/utils/helpers'
import { User } from '../../src/types'

export default function ParentSettings() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const [addingUser, setAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

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
            onSubmit={v => {
              const id = makeId('u')
              dispatch({ type: 'ADD_USER', payload: { id, name: v.name, avatar: v.avatar, role: v.role } })
              if (v.role === 'parent' && v.visibility) dispatch({ type: 'SET_VISIBILITY', payload: { userId: id, visibility: v.visibility } })
            }}
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
            <Avatar avatar={u.avatar} size={36} />
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

        {/* ---- 子どもに見せる学習状況（ログイン中の保護者の分） ---- */}
        {state.currentUser?.role === 'parent' && (
          <View style={[styles.modeCard, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>子どもに見せる学習状況</Text>
            <Text style={styles.modeDesc}>
              オンにした項目だけ、子どもの「おうちの人」タブに表示されます。記録はオフでも保存されます。
            </Text>
            <VisibilitySwitches
              value={state.visibility[state.currentUser.id] ?? ALL_PRIVATE}
              onChange={v => dispatch({ type: 'SET_VISIBILITY', payload: { userId: state.currentUser!.id, visibility: v } })}
            />
          </View>
        )}

        {/* ---- 科目 ---- */}
        <View style={{ marginTop: 12 }}>
          <SubjectsSection />
        </View>

        {/* ---- 使い方 ---- */}
        <View style={[styles.modeCard, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>使い方</Text>
          <Text style={styles.modeDesc}>
            ひとりで勉強する使い方に切り替えられます。家族の登録やタスクはそのまま残ります。
          </Text>
          <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.modeBtn}>
            <Text style={styles.modeBtnText}>🧑‍🎓 ひとりで使うモードへ</Text>
          </TouchableOpacity>
        </View>
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
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  smallBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  deleteBtn: { fontSize: 22, color: '#cbd5e1', paddingHorizontal: 4 },
  modeCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 },
  modeDesc: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  modeBtn: { backgroundColor: '#e8fef3', padding: 12, borderRadius: 10, alignItems: 'center' },
  modeBtnText: { color: '#1e8e5a', fontWeight: '700', fontSize: 14 },
})
