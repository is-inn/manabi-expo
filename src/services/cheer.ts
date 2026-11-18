import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { ref, get, update } from 'firebase/database'
import { auth, db } from './firebase'
import { ensureAuth } from './family'
import { ensureReminderPermission } from './reminders'

/**
 * 「こどもが勉強したよ」の通知（がんばり通知）。サーバーは使わず、次の流れで届ける。
 *   1. 通知を受け取りたい保護者のスマホが、通知用のID（プッシュトークン）を家族の置き場所に登録する
 *        families/{fid}/members/{uid} = { code, at, push, role: 'parent' }
 *   2. こどものスマホが勉強を記録したとき、家族の保護者のIDを読んで、Expo の通知サービスへ送る
 * 通知用のIDは、同じ家族コードでつないだ端末だけが読める（Firebase のルール）。
 */

const PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export type RegisterResult = 'ok' | 'denied' | 'unavailable'

async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  try {
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
    if (!projectId) return null
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data
  } catch {
    // 端末側の通知の準備ができていない（Android で FCM 未設定 など）
    return null
  }
}

/** この端末（保護者）を、がんばり通知の送り先として家族に登録する */
export async function registerParentPush(familyId: string): Promise<RegisterResult> {
  if (!(await ensureReminderPermission())) return 'denied'
  const token = await getPushToken()
  if (!token) return 'unavailable'
  const u = await ensureAuth()
  await update(ref(db, `families/${familyId}/members/${u.uid}`), { push: token, role: 'parent' })
  return 'ok'
}

/** この端末を、がんばり通知の送り先から外す */
export async function unregisterPush(familyId: string): Promise<void> {
  const u = auth.currentUser
  if (!u) return
  await update(ref(db, `families/${familyId}/members/${u.uid}`), { push: null, role: null })
}

/** 家族の保護者のスマホへ通知を送る（自分の端末には送らない）。送った台数を返す */
export async function notifyParents(familyId: string, title: string, body: string): Promise<number> {
  const u = await ensureAuth()
  const snap = await get(ref(db, `families/${familyId}/members`))
  const members = (snap.val() ?? {}) as Record<string, { push?: unknown; role?: unknown }>
  const tokens = Object.entries(members)
    .filter(([uid, m]) => uid !== u.uid && m && m.role === 'parent' && typeof m.push === 'string' && m.push.startsWith('ExponentPushToken'))
    .map(([, m]) => m.push as string)
  if (tokens.length === 0) return 0
  const res = await fetch(PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(tokens.map(to => ({ to, title, body, sound: 'default', data: { kind: 'cheer' } }))),
  })
  if (!res.ok) throw new Error(`push failed: ${res.status}`)
  return tokens.length
}
