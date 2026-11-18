import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useApp } from '../hooks/AppContext'
import { useFamilyStatus } from './FamilySync'
import { notifyParents, registerParentPush, unregisterPush } from '../services/cheer'
import { formatDuration } from '../utils/helpers'

/** 記録を付けてから、この時間以内のものだけ通知する（家族から届いた昔の記録で通知しない） */
const RECENT_MS = 2 * 60 * 1000

/** 記録のIDの "s-<時刻>" から、記録をつけた時刻を取り出す */
const createdAt = (id: string): number => {
  const m = /^s-(\d{10,})/.exec(id)
  return m ? Number(m[1]) : 0
}

/**
 * がんばり通知。画面は出さない。
 * - 保護者: 設定でオンのとき、この端末を通知の送り先として家族に登録（オフ・家族から外れたら取り消す）
 * - こども: 自分が勉強を記録したとき、家族の保護者のスマホへ「勉強したよ」を送る
 */
export default function CheerManager() {
  const { state } = useApp()
  const status = useFamilyStatus()
  const familyId = state.family?.id ?? null
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const registered = useRef<string | null>(null)
  const seen = useRef<Set<string> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => onAuthStateChanged(auth, u => setUid(u?.uid ?? null)), [])

  // 保護者: 送り先の登録・取り消し
  useEffect(() => {
    if (Platform.OS === 'web' || !uid) return
    if (state.cheerNotify && familyId && status === 'ok') {
      if (registered.current === familyId) return
      registerParentPush(familyId)
        .then(r => { if (r === 'ok') registered.current = familyId })
        .catch(e => console.warn('[cheer] register failed', e))
    } else if (!state.cheerNotify && registered.current) {
      const fid = registered.current
      registered.current = null
      unregisterPush(fid).catch(() => {})
    }
  }, [state.cheerNotify, familyId, status, uid])

  // こども: 自分の新しい記録を、保護者へ知らせる
  useEffect(() => {
    const ids = new Set(state.studySessions.map(s => s.id))
    if (seen.current === null) { seen.current = ids; return }
    const prev = seen.current
    seen.current = ids
    const me = stateRef.current.currentUser
    if (!familyId || !me || me.role !== 'child') return
    for (const s of state.studySessions) {
      if (prev.has(s.id) || s.userId !== me.id) continue
      if (Date.now() - createdAt(s.id) > RECENT_MS) continue
      notifyParents(familyId, `👏 ${me.name}さんが勉強したよ`, `${s.subject}　${formatDuration(s.duration)}`)
        .catch(e => console.warn('[cheer] notify failed', e))
    }
  }, [state.studySessions, familyId])

  return null
}
