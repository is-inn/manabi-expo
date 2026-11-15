import { View, Text, TouchableOpacity, StyleSheet, Share, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { useApp } from '../hooks/AppContext'
import { createFamily, formatCode, leaveFamily } from '../services/family'
import { useFamilyStatus } from './FamilySync'
import ConfirmModal from './ConfirmModal'

const STATUS_TEXT = { off: '', connecting: '🔄 つないでいます…', ok: '🟢 同期しています', error: '⚠️ つながっていません（電波を確かめてください）' }

/** 家族コードで、ほかの保護者・こどものスマホとつなぐ（保護者の設定画面） */
export default function FamilyLinkCard() {
  const { state, dispatch } = useApp()
  const status = useFamilyStatus()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const family = state.family

  const create = async () => {
    setBusy(true); setError('')
    try {
      const f = await createFamily()
      // この端末の家族の記録を、新しい家族に送る
      dispatch({ type: 'SET_FAMILY', payload: { ...f, initial: 'push' } })
    } catch (e) {
      console.warn('[family] create failed', e)
      setError('家族コードを作れませんでした。電波のよいところで、もう一度ためしてください。')
    } finally {
      setBusy(false)
    }
  }

  const leave = async () => {
    setConfirmLeave(false)
    if (!family) return
    try { await leaveFamily(family.id) } catch {}
    dispatch({ type: 'SET_FAMILY', payload: null })
  }

  const share = () => {
    if (!family) return
    Share.share({ message: `まなびチームの家族コード：${formatCode(family.code)}\nアプリの「家族コードで参加」に入れてね。` }).catch(() => {})
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📱 家族のスマホをつなぐ</Text>
      {!family ? (
        <>
          <Text style={styles.desc}>
            家族コードを作ると、もう1人の保護者やこどもの「自分のスマホ」でも同じ記録が見られます。{'\n'}
            ・こどものスマホ：タイマーやタスクのチェック{'\n'}
            ・保護者のスマホ：こどもの勉強の確認・タスクを出す{'\n'}
            ※ 記録はサーバーに保存されます（会員登録はいりません）。
          </Text>
          <TouchableOpacity onPress={create} disabled={busy} style={[styles.btn, busy && styles.disabled]}>
            {busy ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>家族コードを作る</Text>}
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      ) : (
        <>
          <Text style={styles.desc}>ほかのスマホで「家族コードで参加」を選び、このコードを入れてください。</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{formatCode(family.code)}</Text>
          </View>
          <Text style={styles.status}>{STATUS_TEXT[status]}</Text>
          <TouchableOpacity onPress={share} style={styles.btn}>
            <Text style={styles.btnText}>コードを送る（LINE・メールなど）</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setConfirmLeave(true)} style={styles.subBtn}>
            <Text style={styles.subBtnText}>このスマホのつながりをやめる</Text>
          </TouchableOpacity>
        </>
      )}

      <ConfirmModal
        visible={confirmLeave}
        title="つながりをやめますか？"
        confirmLabel="やめる"
        message={'このスマホは家族の同期をやめます。\nこのスマホに今ある記録は残ります。家族コードを入れれば、またつなげられます。'}
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  desc: { fontSize: 12, color: '#64748b', lineHeight: 19 },
  btn: { backgroundColor: '#4f9cf9', padding: 13, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.5 },
  subBtn: { padding: 10, alignItems: 'center' },
  subBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  codeBox: { backgroundColor: '#f0f7ff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  code: { fontSize: 30, fontWeight: '700', color: '#1d6fd8', letterSpacing: 3 },
  status: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  error: { fontSize: 12, color: '#ef4444' },
})
