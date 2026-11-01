import { Text } from 'react-native'
import { useApp } from '../../src/hooks/AppContext'
import StudyTimer from '../../src/components/StudyTimer'
import ParentGoalCard from '../../src/components/ParentGoalCard'

/** 保護者が自分の勉強を計る画面（週の目標・ストップウォッチ・タイマー・メモ・直近7日間の記録） */
export default function ParentSelf() {
  const { state } = useApp()
  const me = state.currentUser
  if (!me) return <Text>ログインしてください</Text>
  return <StudyTimer userId={me.id} title="⏱️ じぶんの勉強" showHistory header={<ParentGoalCard userId={me.id} />} />
}
