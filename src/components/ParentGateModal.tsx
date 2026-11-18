import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native'

/** 子どもが暗算では通りにくい 2桁×1桁 の問題を作る（保護者の画面に入るときの確認と同じ形） */
function makeChallenge() {
  const a = Math.floor(Math.random() * 80) + 13   // 13..92
  const b = Math.floor(Math.random() * 6) + 4     // 4..9
  return { a, b, answer: a * b }
}

interface Props {
  visible: boolean
  /** 何をするための確認か（例：「使い方を切りかえる」） */
  purpose: string
  onPass: () => void
  onCancel: () => void
}

/** 「おとなのかくにん」：計算問題に答えられたら先へ進める */
export default function ParentGateModal({ visible, purpose, onPass, onCancel }: Props) {
  const [challenge, setChallenge] = useState(makeChallenge)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const close = () => { setInput(''); setError(false); setChallenge(makeChallenge()); onCancel() }
  const submit = () => {
    if (parseInt(input, 10) === challenge.answer) {
      setInput(''); setError(false); setChallenge(makeChallenge())
      onPass()
    } else {
      setError(true); setInput(''); setChallenge(makeChallenge())
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>おとなのかくにん</Text>
          <Text style={styles.desc}>{purpose}には、おとなの確認が必要です。{'\n'}次の計算の答えを入力してください。</Text>
          <Text style={styles.question}>{challenge.a} × {challenge.b} = ?</Text>
          <TextInput
            value={input}
            // 入力を空にしたとき（まちがいのあと）は、注意の表示を消さない
            onChangeText={t => { const v = t.replace(/[^0-9]/g, ''); setInput(v); if (v !== '') setError(false) }}
            keyboardType="number-pad"
            style={[styles.input, error && styles.inputError]}
            placeholder="答えを入力"
            onSubmitEditing={submit}
          />
          {error && <Text style={styles.errorText}>こたえがちがいます。もう一度どうぞ。</Text>}
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={close} style={[styles.btn, styles.cancel]}>
              <Text style={styles.cancelText}>もどる</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={input.length === 0} style={[styles.btn, styles.submit, input.length === 0 && styles.disabled]}>
              <Text style={styles.submitText}>すすむ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  question: { fontSize: 28, fontWeight: '700', color: '#4f9cf9', textAlign: 'center', marginVertical: 8 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 18, textAlign: 'center' },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#f1f5f9' },
  cancelText: { color: '#64748b', fontWeight: '700' },
  submit: { backgroundColor: '#4f9cf9' },
  disabled: { opacity: 0.45 },
  submitText: { color: 'white', fontWeight: '700' },
})
