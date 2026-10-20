import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useApp } from '../src/hooks/AppContext'

/** 初回起動：使い方を選ぶ。設定画面からもう一度開いて切り替えられる */
export default function WelcomeScreen() {
  const { state, dispatch } = useApp()
  const router = useRouter()

  const chooseSolo = () => {
    // ひとり用の設定がまだなら、名前と目標を決める画面へ
    if (state.solo.name.trim()) {
      dispatch({ type: 'SET_MODE', payload: 'solo' })
      router.replace('/')
    } else {
      router.replace('/solo-setup')
    }
  }

  const chooseFamily = () => {
    dispatch({ type: 'SET_MODE', payload: 'family' })
    router.replace('/')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.title}>まなびチーム</Text>
          <Text style={styles.desc}>どちらで使いますか？{'\n'}あとから設定で切り替えられます。</Text>
        </View>

        <TouchableOpacity style={[styles.card, styles.soloCard]} onPress={chooseSolo}>
          <Text style={styles.cardIcon}>🧑‍🎓</Text>
          <Text style={styles.cardTitle}>ひとりで使う</Text>
          <Text style={styles.cardDesc}>
            自分で科目と目標を決めて、勉強をつづける。{'\n'}
            ストップウォッチ・タイマー・がんばったメモ付き。
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.familyCard]} onPress={chooseFamily}>
          <Text style={styles.cardIcon}>👨‍👩‍👧</Text>
          <Text style={styles.cardTitle}>家族で使う</Text>
          <Text style={styles.cardDesc}>
            保護者がタスクを出して、こどもの勉強をみまもる。{'\n'}
            保護者とこどもを登録して使います。
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>入力した内容はこの端末の中だけに保存されます。</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, padding: 24, gap: 16, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 6, marginBottom: 8 },
  emoji: { fontSize: 52 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a202c' },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 22, gap: 6, alignItems: 'center', borderWidth: 2, shadowColor: '#4f9cf9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3 },
  soloCard: { borderColor: '#4fcf8e' },
  familyCard: { borderColor: '#4f9cf9' },
  cardIcon: { fontSize: 40 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  cardDesc: { fontSize: 12, color: '#64748b', lineHeight: 19, textAlign: 'center' },
  note: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 4 },
})
