import { signInAnonymously, type User as FbUser } from 'firebase/auth'
import { ref, get, set, remove, update } from 'firebase/database'
import { auth, db } from './firebase'
import { sanitize } from '../hooks/AppContext'
import { ParentVisibility, SharedData } from '../types'

/**
 * 家族コードで、保護者・こどものスマホをつなぐ。
 * サーバー（Firebase Realtime Database）の置き場所:
 *   familyCodes/{code}               = familyId（コードから家族をさがす）
 *   families/{fid}/code              = code
 *   families/{fid}/members/{uid}     = { code, at }（つないでいる端末）
 *   families/{fid}/data/{種類}/{key} = JSON文字列（ユーザー・タスク・記録など1件ずつ）
 */

// まぎらわしい文字（0/O, 1/I/L）は使わない
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

const randomFrom = (chars: string, n: number) => {
  let s = ''
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

/** 入力されたコードを、保存している形（大文字8文字）にそろえる */
export const normalizeCode = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** 見せるときは4文字ずつ区切る（例: ABCD-EFGH） */
export const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`

/** ログインしていなければ、名前もメールもいらない「匿名ログイン」をする */
export async function ensureAuth(): Promise<FbUser> {
  if (auth.currentUser) return auth.currentUser
  const cred = await signInAnonymously(auth)
  return cred.user
}

export async function joinAsMember(familyId: string, code: string): Promise<void> {
  const u = await ensureAuth()
  // 通知用のID（push / role）を消さないよう、置きかえずに更新する
  await update(ref(db, `families/${familyId}/members/${u.uid}`), { code, at: Date.now() })
}

/** 新しい家族を作って、家族コードを発行する */
export async function createFamily(): Promise<{ id: string; code: string }> {
  await ensureAuth()
  for (let i = 0; i < 6; i++) {
    const code = randomFrom(CODE_CHARS, CODE_LENGTH)
    if ((await get(ref(db, `familyCodes/${code}`))).exists()) continue
    const id = `f${Date.now().toString(36)}${randomFrom('abcdefghijklmnopqrstuvwxyz0123456789', 12)}`
    await set(ref(db, `familyCodes/${code}`), id)
    await set(ref(db, `families/${id}/code`), code)
    await joinAsMember(id, code)
    return { id, code }
  }
  throw new Error('code-generation-failed')
}

/** 家族コードから家族をさがす。見つからなければ null */
export async function findFamily(input: string): Promise<{ id: string; code: string } | null> {
  const code = normalizeCode(input)
  if (code.length !== CODE_LENGTH) return null
  await ensureAuth()
  const snap = await get(ref(db, `familyCodes/${code}`))
  const id = snap.val()
  return typeof id === 'string' ? { id, code } : null
}

/** この端末を家族から外す（家族の記録は残る） */
export async function leaveFamily(familyId: string): Promise<void> {
  const u = auth.currentUser
  if (!u) return
  await remove(ref(db, `families/${familyId}/members/${u.uid}`))
}

// ---- 共有データ ⇔ サーバーの形 ----

/** サーバーの1件ごとの場所（"種類/key"）→ JSON文字列 */
export type FlatData = Map<string, string>

const safeKey = (k: string) => k.replace(/[.#$/[\]]/g, '_')

export function flatten(d: SharedData): FlatData {
  const m: FlatData = new Map()
  for (const u of d.users) m.set(`users/${safeKey(u.id)}`, JSON.stringify(u))
  for (const t of d.tasks) m.set(`tasks/${safeKey(t.id)}`, JSON.stringify(t))
  for (const s of d.studySessions) m.set(`sessions/${safeKey(s.id)}`, JSON.stringify(s))
  for (const g of d.goals) m.set(`goals/${safeKey(g.userId)}`, JSON.stringify(g))
  for (const t of d.trophies) m.set(`trophies/${safeKey(t.id)}`, JSON.stringify(t))
  for (const [userId, v] of Object.entries(d.visibility)) m.set(`visibility/${safeKey(userId)}`, JSON.stringify({ userId, v }))
  // 科目は並び順が大事なので、まとめて1つで持つ
  m.set('subjects/list', JSON.stringify(d.subjects))
  return m
}

/** サーバーから届いた値を FlatData にする */
export function fromSnapshot(val: unknown): FlatData {
  const m: FlatData = new Map()
  if (!val || typeof val !== 'object') return m
  for (const [kind, items] of Object.entries(val as Record<string, unknown>)) {
    if (!items || typeof items !== 'object') continue
    for (const [key, json] of Object.entries(items as Record<string, unknown>)) {
      if (typeof json === 'string') m.set(`${kind}/${key}`, json)
    }
  }
  return m
}

const parse = <T,>(json: string): T | null => { try { return JSON.parse(json) as T } catch { return null } }
const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

/** FlatData を共有データに戻す（形のおかしいものは捨てる） */
export function unflatten(m: FlatData, fallbackSubjects: SharedData['subjects']): SharedData {
  const users: unknown[] = [], tasks: unknown[] = [], sessions: unknown[] = [], goals: unknown[] = [], trophies: unknown[] = []
  const visibility: Record<string, ParentVisibility> = {}
  let subjects: unknown = null
  for (const [path, json] of m) {
    const kind = path.slice(0, path.indexOf('/'))
    const v = parse<unknown>(json)
    if (v === null) continue
    if (kind === 'users') users.push(v)
    else if (kind === 'tasks') tasks.push(v)
    else if (kind === 'sessions') sessions.push(v)
    else if (kind === 'goals') goals.push(v)
    else if (kind === 'trophies') trophies.push(v)
    else if (kind === 'visibility') {
      const w = v as { userId?: unknown; v?: ParentVisibility }
      if (typeof w.userId === 'string' && w.v) visibility[w.userId] = w.v
    } else if (kind === 'subjects') subjects = v
  }
  const isObj = (x: unknown): x is { id: string } => !!x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string'
  const clean = sanitize({
    users: (users.filter(isObj) as SharedData['users']).filter(u => typeof u.name === 'string' && (u.role === 'parent' || u.role === 'child')).sort(byId),
    tasks: (tasks.filter(isObj) as SharedData['tasks']).sort(byId),
    studySessions: (sessions.filter(isObj) as SharedData['studySessions']).filter(s => Number.isFinite(s.duration)).sort(byId),
    subjects: Array.isArray(subjects) ? (subjects as SharedData['subjects']).filter(s => s && typeof s.name === 'string') : undefined,
    goals: goals as SharedData['goals'],
    trophies: (trophies.filter(isObj) as SharedData['trophies']).sort(byId),
    visibility,
    mode: 'family',
  })
  return {
    users: clean.users ?? [],
    subjects: clean.subjects ?? fallbackSubjects,
    tasks: clean.tasks ?? [],
    studySessions: clean.studySessions ?? [],
    goals: clean.goals ?? [],
    trophies: clean.trophies ?? [],
    visibility: clean.visibility ?? {},
  }
}
