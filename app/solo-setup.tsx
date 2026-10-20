import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useApp } from '../src/hooks/AppContext'
import GoalStepper from '../src/components/GoalStepper'
import { DEFAULT_GOAL_MINUTES, MAX_NAME_LENGTH } from '../src/utils/defaults'

/** ひとりモードの初期設定：名前と、1日の目標時間 */
export default function SoloSetupScreen() {
  const { state, dispatch } = useApp()
  const router = useRouter()
  const [name, setName] = useState(state.solo.name)
  const [goal, setGoal] = useState(state.solo.goalMinutes || DEFAULT_GOAL_MINUTES)
  const trimmed = name.trim()

  const start = () => {
    if (!trimmed) return
    dispatch({ type: 'SET_SOLO_PROFILE', payload: { name: trimmed, goalMinutes: goal } })
    dispatch({ type: 'SET_MODE', payload: 'solo' })
    router.replace('/')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>🧑‍🎓</Text>
          <Text style={styles.title}>ひとりで、つづけよう</Text>
          <Text style={styles.desc}>呼び名と、1日にやりたい勉強の時間を決めてください。{'\n'}あとから設定で変えられます。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>呼び名</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="例：たろう"
            maxLength={MAX_NAME_LENGTH}
            style={styles.input}
            returnKeyType="done"
          />
          <Text style={styles.label}>1日の目標</Text>
          <GoalStepper minutes={goal} onChange={setGoal} />
          <Text style={styles.hint}>目標に届いた日が連続すると「連続日数」が増えます。</Text>
        </View>

        <TouchableOpacity onPress={start} disabled={!trimmed} style={[styles.startBtn, !trimmed && styles.disabled]}>
          <Text style={styles.startText}>はじめる</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/welcome')}>
          <Text style={styles.back}>もどる</Text>
        </TouchableOpacity>
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
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14 },
  hint: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
  startBtn: { backgroundColor: '#4fcf8e', padding: 16, borderRadius: 14, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  startText: { color: 'white', fontSize: 16, fontWeight: '700' },
  back: { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 6 },
})
