import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, onValue, update } from 'firebase/database'
import { auth, db } from '../services/firebase'
import { useApp } from '../hooks/AppContext'
import { ensureAuth, flatten, fromSnapshot, joinAsMember, unflatten, type FlatData } from '../services/family'
import { SharedData } from '../types'

/** 変更をまとめて送るまでの待ち時間 */
const PUSH_DELAY_MS = 800

// ---- つながり具合（設定画面に出す） ----
export type FamilyStatus = 'off' | 'connecting' | 'ok' | 'error'
let status: FamilyStatus = 'off'
const listeners = new Set<() => void>()
const setStatus = (s: FamilyStatus) => { if (status !== s) { status = s; listeners.forEach(l => l()) } }
export const useFamilyStatus = () => useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => status)

const sharedOf = (s: SharedData): SharedData => ({
  users: s.users, subjects: s.subjects, tasks: s.tasks, studySessions: s.studySessions, goals: s.goals, visibility: s.visibility,
})

/** a と b でちがう場所（どちらか一方にしかないものも含む） */
function changedPaths(a: FlatData, b: FlatData): Set<string> {
  const out = new Set<string>()
  for (const [k, v] of a) if (b.get(k) !== v) out.add(k)
  for (const k of b.keys()) if (!a.has(k)) out.add(k)
  return out
}

const sameFlat = (a: FlatData, b: FlatData) => changedPaths(a, b).size === 0

/**
 * 家族コードでつないでいるとき、家族の記録をサーバーと同期する。画面は出さない。
 * - サーバーの変更が届いたら、この端末の「まだ送っていない変更」を残したまま取りこむ
 * - この端末の変更は、少し待ってから1件ずつ送る（消したものは消す）
 */
export default function FamilySync() {
  const { state, dispatch } = useApp()
  const family = state.family
  const familyId = family?.id ?? null
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [loaded, setLoaded] = useState(false)
  const lastRemote = useRef<FlatData | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => onAuthStateChanged(auth, u => setUid(u?.uid ?? null)), [])

  // 家族につないでいるのにログインしていなければ、匿名ログインする（メールでログインし直したときも、そのまま続けられる）
  useEffect(() => {
    if (!familyId) { setStatus('off'); return }
    if (!uid) {
      setStatus('connecting')
      ensureAuth().catch(e => { console.warn('[family] auth failed', e); setStatus('error') })
    }
  }, [familyId, uid])

  // 家族のメンバーとして登録して、変更を受け取りはじめる
  useEffect(() => {
    if (!familyId || !family || !uid) return
    let unsub: (() => void) | undefined
    let stopped = false
    setLoaded(false)
    lastRemote.current = null
    setStatus('connecting')
    const initial = family.initial
    ;(async () => {
      try {
        await joinAsMember(familyId, family.code)
      } catch (e) {
        console.warn('[family] join failed', e)
        if (!stopped) setStatus('error')
        return
      }
      if (stopped) return
      unsub = onValue(ref(db, `families/${familyId}/data`), snap => {
        const remote = fromSnapshot(snap.val())
        const cur = stateRef.current
        const local = flatten(sharedOf(cur))
        let merged: FlatData
        if (lastRemote.current === null && initial !== 'push') {
          // 参加した直後・アプリを開き直した直後: 家族の記録をそのまま使う
          merged = remote
        } else {
          // まだ送っていないこの端末の変更は残す（最初の同期で「送る」ときは、この端末の記録をすべて残す）
          const pending = lastRemote.current === null ? new Set(local.keys()) : changedPaths(local, lastRemote.current)
          merged = new Map(remote)
          for (const k of pending) {
            const v = local.get(k)
            if (v === undefined) merged.delete(k)
            else merged.set(k, v)
          }
        }
        const first = lastRemote.current === null
        lastRemote.current = remote
        if (!sameFlat(merged, local)) dispatch({ type: 'FAMILY_REMOTE', payload: unflatten(merged, cur.subjects) })
        if (first) {
          setLoaded(true)
          if (initial) dispatch({ type: 'SET_FAMILY', payload: { id: familyId, code: family.code } })
        }
        setStatus('ok')
      }, e => {
        console.warn('[family] listen failed', e)
        setStatus('error')
      })
    })()
    return () => { stopped = true; unsub?.() }
    // family.initial は最初の同期にだけ使う（消したときにやり直さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, uid])

  // この端末の変更を送る
  useEffect(() => {
    if (!familyId || !loaded || !uid) return
    const timer = setTimeout(() => {
      const base = lastRemote.current
      if (!base) return
      const local = flatten(sharedOf(stateRef.current))
      const updates: Record<string, string | null> = {}
      for (const k of changedPaths(local, base)) updates[k] = local.get(k) ?? null
      if (Object.keys(updates).length === 0) return
      update(ref(db, `families/${familyId}/data`), updates).catch(e => {
        console.warn('[family] push failed', e)
        setStatus('error')
      })
    }, PUSH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [familyId, loaded, uid, state.users, state.subjects, state.tasks, state.studySessions, state.goals, state.visibility])

  return null
}
