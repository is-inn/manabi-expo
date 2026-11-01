import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { authErrorMessage, useAccount, type RemoteInfo } from '../src/hooks/AccountContext'
import ConfirmModal from '../src/components/ConfirmModal'

type Mode = 'login' | 'signup'

const formatTime = (ms: number) => {
  if (!ms) return '日時不明'
  const d = new Date(ms)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 会員登録・ログイン（メールアドレス＋パスワード）。記録のバックアップと、機種変更時の引き継ぎに使う */
export default function AccountScreen() {
  const router = useRouter()
  const acc = useAccount()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  // ログイン直後に、サーバーにデータがあったとき
  const [remote, setRemote] = useState<RemoteInfo | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(''); setInfo('')
    try { await fn() } catch (e) { setError(authErrorMessage(e)) } finally { setBusy(false) }
  }

  const submit = () => run(async () => {
    if (!email.trim() || !password) { setError('メールアドレスとパスワードを入れてください。'); return }
    if (mode === 'signup') {
      if (password !== password2) { setError('確認用のパスワードが合っていません。'); return }
      await acc.signUp(email, password)
      setInfo('登録しました。この端末のデータを保存しました。')
    } else {
      const r = await acc.signIn(email, password)
      if (r) setRemote(r)
      else setInfo('ログインしました。この端末のデータを保存しました。')
    }
    setPassword(''); setPassword2('')
  })

  const forgot = () => run(async () => {
    if (!email.trim()) { setError('メールアドレスを入れてください。'); return }
    await acc.resetPassword(email)
    setInfo('パスワードを変えるためのメールを送りました。')
  })

  if (!acc.ready) return <SafeAreaView style={styles.safe}><Text style={styles.loading}>読み込み中…</Text></SafeAreaView>

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← もどる</Text></TouchableOpacity>
        <Text style={styles.title}>👤 アカウント</Text>

        {acc.email && !remote ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>ログイン中</Text>
              <Text style={styles.email}>{acc.email}</Text>
              <Text style={styles.note}>
                {acc.syncing
                  ? `記録は自動でサーバーに保存されています${acc.lastBackupAt ? `（最後の保存 ${formatTime(acc.lastBackupAt)}）` : ''}。機種変更のときは、新しい端末で同じメールアドレスでログインしてください。`
                  : 'この端末の記録は、まだサーバーに保存されていません。'}
              </Text>
              <TouchableOpacity disabled={busy} style={[styles.btn, busy && styles.disabled]} onPress={() => run(async () => { await acc.uploadNow(); setInfo('この端末のデータを保存しました。') })}>
                <Text style={styles.btnText}>今すぐ保存する</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setConfirmLogout(true)} style={[styles.btn, styles.sub]}>
              <Text style={styles.subText}>ログアウト</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleting(!deleting)}>
              <Text style={styles.danger}>アカウントを削除する</Text>
            </TouchableOpacity>
            {deleting && (
              <View style={styles.card}>
                <Text style={styles.note}>サーバーに保存した記録とアカウントを消します。この端末の記録は残ります。元に戻せません。確認のため、パスワードを入れてください。</Text>
                <TextInput value={deletePassword} onChangeText={setDeletePassword} placeholder="パスワード" secureTextEntry style={styles.input} autoCapitalize="none" />
                <TouchableOpacity
                  disabled={busy || !deletePassword}
                  style={[styles.btn, styles.dangerBtn, (busy || !deletePassword) && styles.disabled]}
                  onPress={() => run(async () => { await acc.deleteAccount(deletePassword); setDeleting(false); setDeletePassword(''); setInfo('アカウントを削除しました。') })}
                >
                  <Text style={styles.btnText}>削除する</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : remote ? (
          <View style={styles.card}>
            <Text style={styles.label}>サーバーに保存されたデータがあります</Text>
            <Text style={styles.note}>最後の保存: {formatTime(remote.updatedAt)}{'\n'}どちらのデータを使いますか？</Text>
            <TouchableOpacity disabled={busy} style={[styles.btn, busy && styles.disabled]} onPress={() => setConfirmRestore(true)}>
              <Text style={styles.btnText}>サーバーのデータを使う</Text>
            </TouchableOpacity>
            <Text style={styles.note}>この端末の今のデータは、サーバーのデータに置き換わります。</Text>
            <TouchableOpacity disabled={busy} style={[styles.btn, styles.sub]} onPress={() => setConfirmOverwrite(true)}>
              <Text style={styles.subText}>この端末のデータを使う</Text>
            </TouchableOpacity>
            <Text style={styles.note}>サーバーのデータは、この端末のデータで上書きされます。</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.note}>
              登録しなくても、すべての機能が使えます。登録すると、記録がサーバーに保存され、機種変更しても引き継げます。
            </Text>
            <View style={styles.tabs}>
              {(['signup', 'login'] as Mode[]).map(m => (
                <TouchableOpacity key={m} onPress={() => { setMode(m); setError(''); setInfo('') }} style={[styles.tab, mode === m && styles.tabOn]}>
                  <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>{m === 'signup' ? '新規登録' : 'ログイン'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={email} onChangeText={setEmail} placeholder="メールアドレス" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.input} />
            <TextInput value={password} onChangeText={setPassword} placeholder="パスワード（6文字以上）" secureTextEntry autoCapitalize="none" style={styles.input} />
            {mode === 'signup' && (
              <TextInput value={password2} onChangeText={setPassword2} placeholder="パスワード（確認）" secureTextEntry autoCapitalize="none" style={styles.input} />
            )}
            <TouchableOpacity disabled={busy} onPress={submit} style={[styles.btn, busy && styles.disabled]}>
              <Text style={styles.btnText}>{busy ? '通信中…' : mode === 'signup' ? '登録する' : 'ログインする'}</Text>
            </TouchableOpacity>
            {mode === 'login' && (
              <TouchableOpacity onPress={forgot}><Text style={styles.link}>パスワードを忘れたとき</Text></TouchableOpacity>
            )}
            <Text style={styles.small}>
              登録すると、メールアドレスと、この端末の学習記録（家族の名前・アイコン・タスク・勉強時間など）がサーバー（Google Firebase）に保存されます。
            </Text>
          </View>
        )}

        {error !== '' && <Text style={styles.error}>{error}</Text>}
        {info !== '' && <Text style={styles.info}>{info}</Text>}
      </ScrollView>

      <ConfirmModal
        visible={confirmRestore}
        title="サーバーのデータに置き換えますか？"
        message="この端末にあるデータは消えて、サーバーに保存されたデータになります。元に戻せません。"
        onConfirm={() => { setConfirmRestore(false); run(async () => { await acc.restore(); setRemote(null); setInfo('サーバーのデータに置き換えました。') }) }}
        onCancel={() => setConfirmRestore(false)}
      />
      <ConfirmModal
        visible={confirmOverwrite}
        title="サーバーのデータを上書きしますか？"
        message="サーバーに保存されたデータは消えて、この端末のデータになります。元に戻せません。"
        onConfirm={() => { setConfirmOverwrite(false); run(async () => { await acc.uploadNow(); setRemote(null); setInfo('この端末のデータを保存しました。') }) }}
        onCancel={() => setConfirmOverwrite(false)}
      />
      <ConfirmModal
        visible={confirmLogout}
        title="ログアウトしますか？"
        message="この端末の記録は残ります。ログアウト中は、サーバーへの保存は止まります。"
        onConfirm={() => { setConfirmLogout(false); run(async () => { await acc.signOut() }) }}
        onCancel={() => setConfirmLogout(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 12 },
  loading: { padding: 24, color: '#64748b' },
  back: { color: '#4f9cf9', fontWeight: '600', fontSize: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a202c' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  email: { fontSize: 16, fontWeight: '700', color: '#1a202c' },
  note: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  small: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
  tabs: { flexDirection: 'row', gap: 6, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabOn: { backgroundColor: 'white' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextOn: { color: '#4f9cf9' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 },
  btn: { backgroundColor: '#4f9cf9', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700' },
  sub: { backgroundColor: '#f1f5f9' },
  subText: { color: '#64748b', fontWeight: '700' },
  dangerBtn: { backgroundColor: '#ef4444' },
  danger: { textAlign: 'center', color: '#ef4444', fontSize: 13, paddingVertical: 8 },
  disabled: { opacity: 0.45 },
  link: { textAlign: 'center', color: '#4f9cf9', fontSize: 13 },
  error: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  info: { color: '#1e8e5a', fontSize: 13, textAlign: 'center' },
})
