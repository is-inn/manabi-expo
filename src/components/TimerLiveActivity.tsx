import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as LiveActivity from 'expo-live-activity'
import { useApp } from '../hooks/AppContext'

const CONFIG: LiveActivity.LiveActivityConfig = {
  backgroundColor: '#1e293b',
  titleColor: '#ffffff',
  subtitleColor: '#cbd5e1',
  progressViewTint: '#4fcf8e',
  progressViewLabelColor: '#ffffff',
  timerType: 'digital',
  padding: { horizontal: 20, top: 16, bottom: 16 },
}

const clockText = (ms: number) => new Date(ms).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

/** 勉強タイマーの動いている間、iPhoneのロック画面（ライブアクティビティ）に残り時間／経過を出す。画面は出さない */
export default function TimerLiveActivity() {
  const { state } = useApp()
  const { isRunning, subject, startedAt, pausedAt, pausedMs, targetSeconds } = state.timerState
  const activityId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    try {
      const id = activityId.current
      if (!isRunning) {
        if (id) LiveActivity.stopActivity(id, { title: `📖 ${subject || '勉強'}`, subtitle: 'おつかれさま！' })
        activityId.current = undefined
        return
      }

      const paused = pausedAt > 0
      const title = `📖 ${subject}`
      let next: LiveActivity.LiveActivityState
      if (targetSeconds > 0) {
        const elapsedMs = (paused ? pausedAt : Date.now()) - startedAt - pausedMs
        const leftMs = Math.max(targetSeconds * 1000 - elapsedMs, 0)
        next = paused
          ? { title, subtitle: `一時停止中（のこり${Math.ceil(leftMs / 60000)}分）`, progressBar: { progress: 1 - leftMs / (targetSeconds * 1000) } }
          : { title, subtitle: 'のこり時間', progressBar: { date: Date.now() + leftMs } }
      } else {
        next = { title, subtitle: paused ? '一時停止中' : `${clockText(startedAt)}から勉強中` }
      }

      if (id) LiveActivity.updateActivity(id, next)
      else activityId.current = LiveActivity.startActivity(next, CONFIG) ?? undefined
    } catch {
      // ライブアクティビティが使えない端末や設定でも、アプリ本体は止めない
    }
  }, [isRunning, subject, startedAt, pausedAt, pausedMs, targetSeconds])

  return null
}
