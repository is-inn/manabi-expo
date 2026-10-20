import { Subject } from '../types'
import { FALLBACK_SUBJECT_COLOR } from './defaults'

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

export const getStreak = (sessions: { date: string }[]): number => {
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
