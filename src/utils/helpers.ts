import { StudySession, Subject, User } from '../types'
import { FALLBACK_SUBJECT_COLOR, SOLO_USER_ID } from './defaults'

/**
 * ひとりモードの記録と合算する「家族モードの自分（保護者）」のID。
 * ログイン中の保護者がいればその人。いなければ、保護者が1人だけのときのその人。決められなければ null
 */
export const pickMyParentId = (users: User[], currentUser: User | null): string | null => {
  if (currentUser?.role === 'parent') return currentUser.id
  const parents = users.filter(u => u.role === 'parent')
  return parents.length === 1 ? parents[0].id : null
}

/** ひとりモードの記録と、家族モードの自分（保護者）の記録をまとめる */
export const mergeOwnSessions = (sessions: StudySession[], parentId: string | null): StudySession[] =>
  sessions.filter(s => s.userId === SOLO_USER_ID || (parentId !== null && s.userId === parentId))

export const getSubjectColor = (subjects: Subject[], name: string): string =>
  subjects.find(s => s.name === name)?.color ?? FALLBACK_SUBJECT_COLOR

export const makeId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}時間${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

/** 時計表示（mm:ss、1時間以上は h:mm:ss） */
export const formatClock = (seconds: number): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** 端末のタイムゾーンでの日付（YYYY-MM-DD）。toISOString はUTC基準で、日本の午前0〜9時に前日になってしまう */
export const toDateStr = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const getTodayStr = (): string => toDateStr(new Date())

/** くり返しタスクか（やる曜日が1つ以上ある） */
export const isRepeating = (t: { repeatDays?: number[] }): boolean => !!t.repeatDays && t.repeatDays.length > 0

/** そのタスクが、その日に「やるもの」か。単発は常に対象、くり返しは曜日が合う日だけ */
export const isTaskForDay = (t: { repeatDays?: number[] }, day: string = getTodayStr()): boolean => {
  if (!isRepeating(t)) return true
  const [y, m, d] = day.split('-').map(Number)
  return t.repeatDays!.includes(new Date(y, m - 1, d).getDay())
}

/** その日に完了しているか。単発は completed、くり返しは「その日」に印があるか */
export const isTaskDone = (t: { completed: boolean; repeatDays?: number[]; doneDates?: string[] }, day: string = getTodayStr()): boolean =>
  isRepeating(t) ? (t.doneDates ?? []).includes(day) : t.completed

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']
/** 「毎日」「毎週 月・水」などの表示 */
export const repeatLabel = (days: number[]): string =>
  days.length >= 7 ? '毎日' : `毎週 ${[...days].sort((a, b) => a - b).map(d => DAY_NAMES[d]).join('・')}`

export const getTotalStudyTime = (sessions: { duration: number }[]): number =>
  sessions.reduce((acc, s) => acc + s.duration, 0)

/** 日付ごとの合計秒数 */
export const getDailyTotals = (sessions: { date: string; duration: number }[]): Record<string, number> => {
  const totals: Record<string, number> = {}
  sessions.forEach(s => { totals[s.date] = (totals[s.date] ?? 0) + s.duration })
  return totals
}

/** 1日の目標を達成した日が何日連続しているか（今日まだ届いていなくても、昨日までの連続は途切れさせない） */
export const getGoalStreak = (sessions: { date: string; duration: number }[], goalSeconds: number): number => {
  const totals = getDailyTotals(sessions)
  const need = Math.max(goalSeconds, 1)
  const cursor = new Date()
  if ((totals[toDateStr(cursor)] ?? 0) < need) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while ((totals[toDateStr(cursor)] ?? 0) >= need) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** 端末内の持ち主ID（UUID v4 形式。通信には使わない） */
export const generateAccountId = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

/** 今週の月曜日（YYYY-MM-DD）。週は月曜はじまり */
export const getWeekStartStr = (now: Date = new Date()): string => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toDateStr(d)
}

/** 今週（月曜〜今日）の記録だけ。日付は YYYY-MM-DD なので文字列比較でよい */
export const getWeekSessions = <T extends { date: string }>(sessions: T[]): T[] => {
  const start = getWeekStartStr()
  return sessions.filter(s => s.date >= start)
}

/** 科目ごとの合計秒数（多い順） */
export const getSubjectTotals = (sessions: { subject: string; duration: number }[]): { subject: string; seconds: number }[] => {
  const totals: Record<string, number> = {}
  sessions.forEach(s => { totals[s.subject] = (totals[s.subject] ?? 0) + s.duration })
  return Object.entries(totals).map(([subject, seconds]) => ({ subject, seconds })).sort((a, b) => b.seconds - a.seconds)
}

/** 今日から期限までの日数（今日=0、過ぎていれば負） */
export const getDaysUntil = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const today = new Date()
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const b = new Date(y, m - 1, d).getTime()
  return Math.round((b - a) / 86400000)
}

/** これまでで一番長かった連続日数（needSeconds 以上勉強した日を数える。0 なら1秒でも勉強した日） */
export const getBestStreak = (sessions: { date: string; duration: number }[], needSeconds = 1): number => {
  const totals = getDailyTotals(sessions)
  const days = Object.keys(totals).filter(d => totals[d] >= Math.max(needSeconds, 1)).sort()
  let best = 0
  let run = 0
  let prev = ''
  for (const day of days) {
    if (prev) {
      const [y, m, d] = prev.split('-').map(Number)
      const next = new Date(y, m - 1, d)
      next.setDate(next.getDate() + 1)
      run = toDateStr(next) === day ? run + 1 : 1
    } else run = 1
    best = Math.max(best, run)
    prev = day
  }
  return best
}

/** 連続日数のバッジ */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100]

export interface WeekReview {
  weekStart: string
  totalSeconds: number
  prevSeconds: number
  daysStudied: number
  topSubject: string | null
  bestDay: { label: string; seconds: number } | null
}

/** 先週（月曜〜日曜）のふりかえり。比べるのはその前の週 */
export const getLastWeekReview = (sessions: { date: string; duration: number; subject: string }[], now: Date = new Date()): WeekReview => {
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7))
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(lastMonday.getDate() - 7)
  const prevMonday = new Date(thisMonday)
  prevMonday.setDate(prevMonday.getDate() - 14)
  const [a, b, c] = [toDateStr(prevMonday), toDateStr(lastMonday), toDateStr(thisMonday)]
  const last = sessions.filter(s => s.date >= b && s.date < c)
  const prev = sessions.filter(s => s.date >= a && s.date < b)
  const totals = getDailyTotals(last)
  const labels = ['日', '月', '火', '水', '木', '金', '土']
  let bestDay: WeekReview['bestDay'] = null
  for (const [date, seconds] of Object.entries(totals)) {
    if (!bestDay || seconds > bestDay.seconds) {
      const [y, m, d] = date.split('-').map(Number)
      bestDay = { label: labels[new Date(y, m - 1, d).getDay()], seconds }
    }
  }
  return {
    weekStart: b,
    totalSeconds: getTotalStudyTime(last),
    prevSeconds: getTotalStudyTime(prev),
    daysStudied: Object.keys(totals).length,
    topSubject: getSubjectTotals(last)[0]?.subject ?? null,
    bestDay,
  }
}

export const getStreak =(sessions: { date: string }[]): number => {
  if (sessions.length === 0) return 0
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
  let streak = 0
  let checkDate = getTodayStr()
  for (const date of dates) {
    if (date === checkDate) {
      streak++
      // new Date('YYYY-MM-DD') はUTC扱いになるので、年月日を分けて端末の時間で作る
      const [y, m, day] = checkDate.split('-').map(Number)
      const d = new Date(y, m - 1, day)
      d.setDate(d.getDate() - 1)
      checkDate = toDateStr(d)
    } else break
  }
  return streak
}
