import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useApp } from '../src/hooks/AppContext'
import MemberForm from '../src/components/MemberForm'
import { makeId } from '../src/utils/helpers'

/** 初回起動：ご家族を登録する（保護者1人以上・こども1人以上で「はじめる」が押せる） */
export default function SetupScreen() {
  const { state, dispatch } = useApp()
  const router = useRouter()

  const parents = state.users.filter(u => u.role === 'parent')
  const children = state.users.filter(u => u.role === 'child')
  const ready = parents.length > 0 && children.length > 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.title}>まなびチームへようこそ</Text>
          <Text style={styles.desc}>
            ご家族を登録してはじめましょう。{'\n'}
            保護者とこどもを、それぞれ1人以上登録してください。{'\n'}
            入力した内容はこの端末の中だけに保存されます。
          </Text>
        </View>

        {state.users.length > 0 && (
          <View style={styles.listCard}>
            <Text style={styles.listLabel}>登録したご家族</Text>
            {state.users.map(u => (
              <View key={u.id} style={styles.memberRow}>
                <Text style={styles.memberAvatar}>{u.avatar}</Text>
                <Text style={styles.memberName}>{u.name}</Text>
                <View style={[styles.badge, { backgroundColor: u.role === 'parent' ? '#e8f3fe' : '#e8fef3' }]}>
                  <Text style={[styles.badgeText, { color: u.role === 'parent' ? '#4f9cf9' : '#4fcf8e' }]}>
                    {u.role === 'parent' ? '保護者' : 'こども'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => dispatch({ type: 'DELETE_USER', payload: u.id })}>
                  <Text style={styles.deleteBtn}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 保護者が1人入ったら、次の入力はこどもから始める */}
        <MemberForm
          key={parents.length > 0 ? 'child' : 'parent'}
          defaultRole={parents.length > 0 ? 'child' : 'parent'}
          submitLabel="＋ 追加する"
          onSubmit={v => {
            const id = makeId('u')
            dispatch({ type: 'ADD_USER', payload: { id, name: v.name, avatar: v.avatar, role: v.role } })
            if (v.role === 'parent' && v.visibility) dispatch({ type: 'SET_VISIBILITY', payload: { userId: id, visibility: v.visibility } })
          }}
        />

        <TouchableOpacity
          onPress={() => { dispatch({ type: 'SET_MODE', payload: 'family' }); router.replace('/') }}
          disabled={!ready}
          style={[styles.startBtn, !ready && styles.startDisabled]}
        >
          <Text style={styles.startText}>はじめる</Text>
        </TouchableOpacity>
        {!ready && (
          <Text style={styles.hint}>
            {parents.length === 0 ? '保護者を1人以上' : 'こどもを1人以上'}登録すると、はじめられます
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { padding: 20, gap: 16 },
  header: { alignItems: 'center', gap: 6, marginTop: 8 },
  emoji: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a202c' },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 20, textAlign: 'center' },
  listCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 },
  listLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberAvatar: { fontSize: 26 },
  memberName: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { fontSize: 22, color: '#cbd5e1', paddingHorizontal: 6 },
  startBtn: { backgroundColor: '#4fcf8e', padding: 16, borderRadius: 14, alignItems: 'center' },
  startDisabled: { opacity: 0.4 },
  startText: { color: 'white', fontSize: 16, fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: 12, color: '#94a3b8' },
})
