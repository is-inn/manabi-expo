import { useEffect } from 'react'
import { useApp } from '../hooks/AppContext'
import { computeAutoTrophies } from '../utils/trophies'

/** 勉強の記録がふえたら、もらえるトロフィーを自動で渡す。画面は出さない */
export default function TrophyManager() {
  const { state, dispatch } = useApp()
  useEffect(() => {
    const earned = computeAutoTrophies(state)
    if (earned.length === 0) return
    const have = new Set(state.trophies.map(t => t.id))
    const fresh = earned.filter(t => !have.has(t.id))
    if (fresh.length > 0) dispatch({ type: 'AWARD_TROPHIES', payload: fresh })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.studySessions, state.goals, state.users, state.solo, state.trophies])
  return null
}
