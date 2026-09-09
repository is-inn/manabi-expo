export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}時間${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

export const getTodayStr = (): string => new Date().toISOString().split('T')[0]

export const getTotalStudyTime = (sessions: { duration: number }[]): number =>
  sessions.reduce((acc, s) => acc + s.duration, 0)

export const getStreak = (sessions: { date: string }[]): number => {
  if (sessions.length === 0) return 0
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
  let streak = 0
  let checkDate = getTodayStr()
  for (const date of dates) {
    if (date === checkDate) {
      streak++
      const d = new Date(checkDate)
      d.setDate(d.getDate() - 1)
      checkDate = d.toISOString().split('T')[0]
    } else break
  }
  return streak
}
