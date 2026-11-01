import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useApp } from '../../src/hooks/AppContext'
import GoalStepper from '../../src/components/GoalStepper'
import SubjectsSection from '../../src/components/SubjectsSection'
import { MAX_NAME_LENGTH } from '../../src/utils/defaults'

export default function SoloSettings() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const [name, setName] = useState(state.solo.name)
  const trimmed = name.trim()
  const changed = trimmed.length > 0 && trimmed !== state.solo.name

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>⚙️ 設定</Text>

        <View style={styles.card}>
          <Text style={styles.label}>呼び名</Text>
          <View style={styles.nameRow}>
            <TextInput value={name} onChangeText={setName} maxLength={MAX_NAME_LENGTH} style={styles.input} returnKeyType="done" />
            <TouchableOpacity
              onPress={() => dispatch({ type: 'SET_SOLO_PROFILE', payload: { ...state.solo, name: trimmed } })}
              disabled={!changed}
              style={[styles.saveBtn, !changed && styles.disabled]}
            >
              <Text style={styles.saveText}>保存</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>1日の目標</Text>
          <GoalStepper
            minutes={state.solo.goalMinutes}
            onChange={m => dispatch({ type: 'SET_SOLO_PROFILE', payload: { ...state.solo, goalMinutes: m } })}
          />
          <Text style={styles.hint}>目標を変えると、連続日数も新しい目標で数え直されます。</Text>
        </View>

        <SubjectsSection />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>アカウント（あとから登録できます）</Text>
          <Text style={styles.hint}>登録すると、記録がサーバーに保存され、機種変更しても引き継げます。登録しなくても使えます。</Text>
          <TouchableOpacity onPress={() => router.push('/account')} style={styles.modeBtn}>
            <Text style={styles.modeBtnText}>👤 会員登録・ログイン</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>使い方</Text>
          <Text style={styles.hint}>家族で使う形に切り替えられます。ひとりの記録はそのまま残ります。</Text>
          <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.modeBtn}>
            <Text style={styles.modeBtnText}>👨‍👩‍👧 家族で使うモードへ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 16 },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  nameRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: '#4f9cf9', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  saveText: { color: 'white', fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.4 },
  hint: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  modeBtn: { backgroundColor: '#e8f3fe', padding: 12, borderRadius: 10, alignItems: 'center' },
  modeBtnText: { color: '#4f9cf9', fontWeight: '700', fontSize: 14 },
})
