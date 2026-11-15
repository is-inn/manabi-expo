import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useApp } from '../src/hooks/AppContext'
import { findFamily, normalizeCode } from '../src/services/family'

/** 家族コードを入れて、家族（保護者・こどものスマホ）とつなぐ */
export default function JoinScreen() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = normalizeCode(code).length === 8
  const hasLocalFamily = state.users.length > 0

  const join = async () => {
    setBusy(true); setError('')
    try {
      const f = await findFamily(code)
      if (!f) { setError('この家族コードは見つかりませんでした。もう一度たしかめてください。'); return }
      // 家族の記録を受け取る（この端末の家族の記録は、家族のものに置きかわる）
      dispatch({ type: 'SET_FAMILY', payload: { ...f, initial: 'pull' } })
      dispatch({ type: 'SET_MODE', payload: 'family' })
      dispatch({ type: 'LOGOUT' })
      router.replace('/')
    } catch (e) {
      console.warn('[family] join failed', e)
      setError('つなげませんでした。電波のよいところで、もう一度ためしてください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>🔗</Text>
          <Text style={styles.title}>家族コードで参加</Text>
          <Text style={styles.desc}>
            保護者のスマホの「設定 → 家族のスマホをつなぐ」に出ている{'\n'}8文字のコードを入れてください。
          </Text>
        </View>

        <View style={styles.card}>
          <TextInput
            value={code}
            onChangeText={t => { setCode(t); setError('') }}
            placeholder="例：ABCD-EFGH"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={9}
            style={styles.input}
            onSubmitEditing={() => ready && join()}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {hasLocalFamily && (
            <Text style={styles.warn}>※ このスマホに登録してある家族の記録は、つないだ家族の記録に置きかわります。</Text>
          )}
          <TouchableOpacity onPress={join} disabled={!ready || busy} style={[styles.btn, (!ready || busy) && styles.disabled]}>
            {busy ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>つなぐ</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.help}>
          <Text style={styles.helpTitle}>つないだあとは</Text>
          <Text style={styles.helpText}>
            ・名前のならんだ画面で、じぶんの名前をえらびます{'\n'}
            ・こどものスマホ：じぶんの名前 → タイマーやタスクが使えます{'\n'}
            ・保護者のスマホ：保護者の名前 → こどもの記録が見られます
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>もどる</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, padding: 24, gap: 16, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 6 },
  emoji: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a202c' },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, gap: 12 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 24, textAlign: 'center', letterSpacing: 3, fontWeight: '700' },
  error: { fontSize: 12, color: '#ef4444' },
  warn: { fontSize: 11, color: '#92651a', lineHeight: 16 },
  btn: { backgroundColor: '#4f9cf9', padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.4 },
  help: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 6 },
  helpTitle: { fontSize: 13, fontWeight: '700', color: '#1a202c' },
  helpText: { fontSize: 12, color: '#64748b', lineHeight: 20 },
  back: { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 8 },
})
