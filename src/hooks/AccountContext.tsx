import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged,
  sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider, type User as FbUser,
} from 'firebase/auth'
import { ref, get, set, remove } from 'firebase/database'
import { auth, db } from '../services/firebase'
import { useApp, sanitize, toPersisted } from './AppContext'

/** どのユーザーのバックアップと同期済みか（この端末でログイン後に「復元」か「上書き」を選んだ印） */
const SYNC_MARK_KEY = 'manabi:syncUid'
const BACKUP_DELAY_MS = 3000

export interface RemoteInfo { updatedAt: number }

interface AccountContextValue {
  /** ログイン状態を調べ終わったか */
  ready: boolean
  email: string | null
  /** サーバーのバックアップと自動で同期している */
  syncing: boolean
  lastBackupAt: number | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<RemoteInfo | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  /** この端末のデータをサーバーに保存する（サーバー側は上書き） */
  uploadNow: () => Promise<void>
  /** サーバーのデータでこの端末を置き換える */
  restore: () => Promise<boolean>
  deleteAccount: (password: string) => Promise<void>
}

const AccountContext = createContext<AccountContextValue | null>(null)

/** Firebase のエラーを、やさしい日本語にする */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email': return 'メールアドレスの形が正しくありません。'
    case 'auth/email-already-in-use': return 'このメールアドレスはすでに登録されています。ログインしてください。'
    case 'auth/weak-password': return 'パスワードは6文字以上にしてください。'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'メールアドレスかパスワードが違います。'
    case 'auth/too-many-requests': return '何度も失敗したため、しばらく待ってからやり直してください。'
    case 'auth/network-request-failed': return '通信できませんでした。電波のよいところでやり直してください。'
    case 'auth/requires-recent-login': return 'もう一度ログインしてから、やり直してください。'
    case 'PERMISSION_DENIED': return 'サーバーに保存する権限がありません。ログインし直してください。'
    default: return 'うまくいきませんでした。しばらくしてからやり直してください。'
  }
}

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, dispatch } = useApp()
  const [user, setUser] = useState<FbUser | null>(null)
  const [ready, setReady] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => onAuthStateChanged(auth, async u => {
    setUser(u)
    if (u) {
      try { setSyncing((await AsyncStorage.getItem(SYNC_MARK_KEY)) === u.uid) } catch { setSyncing(false) }
    } else {
      setSyncing(false)
    }
    setReady(true)
  }), [])

  const upload = useCallback(async (u: FbUser) => {
    const payload = JSON.stringify(toPersisted(stateRef.current))
    const updatedAt = Date.now()
    await set(ref(db, `users/${u.uid}/backup`), { data: payload, updatedAt })
    setLastBackupAt(updatedAt)
  }, [])

  const markSynced = useCallback(async (u: FbUser) => {
    try { await AsyncStorage.setItem(SYNC_MARK_KEY, u.uid) } catch {}
    setSyncing(true)
  }, [])

  // 同期中は、変更から少し待ってサーバーに保存する
  useEffect(() => {
    if (!user || !syncing) return
    const timer = setTimeout(() => { upload(user).catch(e => console.warn('[account] backup failed', e)) }, BACKUP_DELAY_MS)
    return () => clearTimeout(timer)
  }, [user, syncing, state.mode, state.accountId, state.goals, state.visibility, state.users, state.solo, state.subjects, state.tasks, state.studySessions, state.trophies, upload])

  const signUp = useCallback(async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    // 新しいアカウントなので、この端末のデータをそのまま保存して同期を始める
    await upload(cred.user)
    await markSynced(cred.user)
  }, [upload, markSynced])

  const signIn = useCallback(async (email: string, password: string): Promise<RemoteInfo | null> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    const snap = await get(ref(db, `users/${cred.user.uid}/backup`))
    if (snap.exists()) {
      const v = snap.val() as { updatedAt?: number }
      return { updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : 0 }
    }
    // サーバーにまだ何もない: この端末のデータを保存して同期を始める
    await upload(cred.user)
    await markSynced(cred.user)
    return null
  }, [upload, markSynced])

  const restore = useCallback(async (): Promise<boolean> => {
    const u = auth.currentUser
    if (!u) return false
    const snap = await get(ref(db, `users/${u.uid}/backup`))
    if (!snap.exists()) return false
    const raw = (snap.val() as { data?: string }).data
    if (typeof raw !== 'string') return false
    const restored = sanitize(JSON.parse(raw))
    dispatch({ type: 'REPLACE_STATE', payload: restored })
    await markSynced(u)
    return true
  }, [dispatch, markSynced])

  const uploadNow = useCallback(async () => {
    const u = auth.currentUser
    if (!u) return
    await upload(u)
    await markSynced(u)
  }, [upload, markSynced])

  const signOut = useCallback(async () => {
    try { await AsyncStorage.removeItem(SYNC_MARK_KEY) } catch {}
    setSyncing(false)
    await fbSignOut(auth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim())
  }, [])

  const deleteAccount = useCallback(async (password: string) => {
    const u = auth.currentUser
    if (!u || !u.email) return
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password))
    await remove(ref(db, `users/${u.uid}`))
    await deleteUser(u)
    try { await AsyncStorage.removeItem(SYNC_MARK_KEY) } catch {}
    setSyncing(false)
  }, [])

  return (
    <AccountContext.Provider value={{
      ready, email: user?.email ?? null, syncing, lastBackupAt,
      signUp, signIn, signOut, resetPassword, uploadNow, restore, deleteAccount,
    }}>
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be used within AccountProvider')
  return ctx
}
