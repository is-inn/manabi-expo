import StudyTimer from '../../src/components/StudyTimer'
import { SOLO_USER_ID } from '../../src/utils/defaults'

export default function SoloTimer() {
  return <StudyTimer userId={SOLO_USER_ID} />
}
