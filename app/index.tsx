import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, TextInput, ScrollView } from 'react-native'
import { useRouter, Redirect } from 'expo-router'
import { useState } from 'react'
import { useApp } from '../src/hooks/AppContext'
import { User } from '../src/types'

/** 子どもが暗算では通りにくい 2桁×1桁 の問題を生成する（Families Policy 準拠のペアレンタルゲート） */
function makeChallenge() {
  const a = Math.floor(Math.random() * 80) + 13   // 13..92
  const b = Math.floor(Math.random() * 6) + 4     // 4..9
  return { a, b, answer: a * b }
}

export default function LoginScreen() {
  const { state, dispatch } = useApp()
  const router = useRouter()

  const [gateUser, setGateUser] = useState<User | null>(null)
  const [challenge, setChallenge] = useState(makeChallenge)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const enter = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user })
    router.replace(user.role === 'parent' ? '/parent/home' : '/child/home')
  }

  const handleSelect = (user: User) => {
    if (user.role === 'child') { enter(user); return }
    // 保護者はゲートを通す
    setChallenge(makeChallenge())
    setInput('')
    setError(false)
    setGateUser(user)
  }

  const closeGate = () => { setGateUser(null); setInput(''); setError(false) }

  const submitGate = () => {
    if (parseInt(input, 10) === challenge.answer && gateUser) {
      const u = gateUser
      closeGate()
      enter(u)
    } else {
      setError(true)
      setInput('')
      setChallenge(makeChallenge())
    }
  }

  // 使い方によって入口を分ける
  if (state.mode === 'solo') return <Redirect href="/solo/home" />
  if (state.mode === null && state.users.length === 0) return <Redirect href="/welcome" />
  // 保護者が1人もいなければ初回登録へ（保護者がいないと設定画面に入れないため）
  if (!state.users.some(u => u.role === 'parent')) return <Redirect href="/setup" />

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>📚</Text>
        <Text style={styles.title}>まなびチーム</Text>
        <Text style={styles.subtitle}>だれでログインしますか？</Text>
      </View>
      <View style={styles.grid}>
        {state.users.map(user => (
          <TouchableOpacity key={user.id} style={styles.card} onPress={() => handleSelect(user)}>
            <Text style={styles.avatar}>{user.avatar}</Text>
            <Text style={styles.name}>{user.name}</Text>
            <View style={[styles.badge, { backgroundColor: user.role === 'parent' ? '#e8f3fe' : '#e8fef3' }]}>
              <Text style={[styles.badgeText, { color: user.role === 'parent' ? '#4f9cf9' : '#4fcf8e' }]}>
                {user.role === 'parent' ? '保護者' : 'こども'}
              </Text>
            </View>
            {user.role === 'parent' && <Text style={styles.lock}>🔒 おとなのかくにん</Text>}
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>

      <Modal visible={gateUser !== null} transparent animationType="fade" onRequestClose={closeGate}>
        <View style={styles.backdrop}>
          <View style={styles.gateCard}>
            <Text style={styles.gateTitle}>保護者の方の確認</Text>
            <Text style={styles.gateDesc}>この先は保護者向けの画面です。{'\n'}次の計算の答えを入力してください。</Text>
            <Text style={styles.question}>{challenge.a} × {challenge.b} = ?</Text>
            <TextInput
              value={input}
              onChangeText={t => { setInput(t.replace(/[^0-9]/g, '')); setError(false) }}
              keyboardType="number-pad"
              style={[styles.gateInput, error && styles.gateInputError]}
              placeholder="答えを入力"
              autoFocus
              onSubmitEditing={submitGate}
            />
            {error && <Text style={styles.errorText}>こたえがちがいます。もう一度どうぞ。</Text>}
            <View style={styles.gateBtnRow}>
              <TouchableOpacity onPress={closeGate} style={[styles.gateBtn, styles.gateCancel]}>
                <Text style={styles.gateCancelText}>もどる</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitGate}
                disabled={input.length === 0}
                style={[styles.gateBtn, styles.gateSubmit, input.length === 0 && styles.gateDisabled]}
              >
                <Text style={styles.gateSubmitText}>すすむ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', color: '#1a202c' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 360 },
  card: { width: 155, backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, shadowColor: '#4f9cf9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  avatar: { fontSize: 40 },
  name: { fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  lock: { fontSize: 10, color: '#94a3b8' },

  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, gap: 12 },
  gateTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  gateDesc: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  question: { fontSize: 28, fontWeight: '700', color: '#4f9cf9', textAlign: 'center', marginVertical: 8 },
  gateInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 18, textAlign: 'center' },
  gateInputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, textAlign: 'center' },
  gateBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  gateBtn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  gateCancel: { backgroundColor: '#f1f5f9' },
  gateCancelText: { color: '#64748b', fontWeight: '700' },
  gateSubmit: { backgroundColor: '#4f9cf9' },
  gateDisabled: { opacity: 0.45 },
  gateSubmitText: { color: 'white', fontWeight: '700' },
})
