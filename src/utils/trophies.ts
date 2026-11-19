import { AppState, Trophy } from '../types'
import { SOLO_USER_ID } from './defaults'
import { getBestStreak, getWeekStartStr } from './helpers'

/** 続けた日数でもらえるトロフィー */
export const STREAK_TROPHY_DAYS = [3, 7, 14, 30]

/** 保護者から送れるトロフィーのアイコン */
export const PARENT_TROPHY_ICONS = ['🏆', '🥇', '⭐', '🌟', '🎉', '💪', '👏', '🌈']

/**
 * 勉強の記録から、自動でもらえるトロフィーを数える。
 * 中身（id・日付）は記録だけで決まるので、どの端末で数えても同じになる（家族のスマホ同士で食いちがわない）。
 * - 継続：勉強した日が 3・7・14・30 日つづいたことがある
 * - 週の目標：保護者が決めた「週の目標」を、今週のうちに達成した
 */
export function computeAutoTrophies(s: Pick<AppState, 'users' | 'studySessions' | 'goals' | 'solo'>): Trophy[] {
  const out: Trophy[] = []
  const weekStart = getWeekStartStr()
  const people: { id: string; need: number }[] = s.users.map(u => ({ id: u.id, need: 1 }))
  // ひとりモードは「1日の目標」を達成した日を数える
  if (s.solo.name.trim()) people.push({ id: SOLO_USER_ID, need: s.solo.goalMinutes * 60 })

  for (const p of people) {
    const sessions = s.studySessions.filter(x => x.userId === p.id)
    if (sessions.length === 0) continue
    const best = getBestStreak(sessions, p.need)
    for (const n of STREAK_TROPHY_DAYS) {
      if (best >= n) out.push({ id: `st-${p.id}-${n}`, userId: p.id, kind: 'streak', icon: '🏅', title: `${n}日つづけた`, date: '' })
    }
    const goal = s.goals.find(g => g.userId === p.id)
    if (goal) {
      const week = sessions.filter(x => x.date >= weekStart).reduce((a, x) => a + x.duration, 0)
      if (week >= goal.weeklyMinutes * 60) {
        out.push({ id: `wg-${p.id}-${weekStart}`, userId: p.id, kind: 'week', icon: '🏆', title: '週の目標たっせい', date: weekStart })
      }
    }
  }
  return out
}
