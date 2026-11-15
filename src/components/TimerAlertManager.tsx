import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useApp } from '../hooks/AppContext'
import { ensureReminderPermission } from '../services/reminders'
import { cancelTimerEnd, playTimerEndAlert, scheduleTimerEnd } from '../services/timerAlert'

/** 開いているときにすぎていても、これより前に終わっていたら鳴らさない（通知がもう届いているため） */
const LATE_LIMIT_MS = 5000

/**
 * タイマー（カウントダウン）の終わりを知らせる。画面は出さない。
 * - 動いている間は、終わる時刻に通知を予約しておく（画面を閉じていても届く）
 * - アプリを開いているときに終わったら、バイブ（と設定によっては音）で知らせる
 */
export default function TimerAlertManager() {
  const { state } = useApp()
  const { isRunning, startedAt, pausedAt, pausedMs, targetSeconds, elapsed, subject } = state.timerState
  const alert = state.timerAlert
  const counting = isRunning && pausedAt === 0 && targetSeconds > 0
  const endAt = counting ? startedAt + pausedMs + targetSeconds * 1000 : 0
  const alerted = useRef(0)

  // 通知の予約（始めた・つづけた・設定を変えたとき）。止めた・一時停止したら取り消す
  useEffect(() => {
    if (Platform.OS === 'web') return
    if (!counting) { cancelTimerEnd(); return }
    let cancelled = false
    ;(async () => {
      if (alert.notify) await ensureReminderPermission()
      if (!cancelled) await scheduleTimerEnd(endAt, subject, alert)
    })()
    return () => { cancelled = true }
  }, [counting, endAt, subject, alert.notify, alert.sound])

  // 開いている間に終わったら、1回だけ知らせる
  useEffect(() => {
    if (!isRunning || targetSeconds <= 0 || elapsed < targetSeconds) return
    const end = startedAt + pausedMs + targetSeconds * 1000
    if (alerted.current === startedAt) return
    alerted.current = startedAt
    cancelTimerEnd()
    if (Date.now() - end <= LATE_LIMIT_MS) playTimerEndAlert(alert)
  }, [isRunning, targetSeconds, elapsed, startedAt, pausedMs])

  return null
}
