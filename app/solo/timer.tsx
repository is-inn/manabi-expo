import StudyTimer from '../../src/components/StudyTimer'
import { useApp } from '../../src/hooks/AppContext'
import { SOLO_USER_ID } from '../../src/utils/defaults'
import { pickMyParentId } from '../../src/utils/helpers'

export default function SoloTimer() {
  const { state } = useApp()
  // 家族モードの自分（保護者）の記録も、今日の合計にあわせて数える
  const parentId = pickMyParentId(state.users, state.currentUser)
  return <StudyTimer userId={SOLO_USER_ID} alsoUserIds={parentId ? [parentId] : []} />
}
