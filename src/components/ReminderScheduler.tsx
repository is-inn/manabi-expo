import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useApp } from '../hooks/AppContext'
import { syncReminders } from '../services/reminders'
import { getTodayStr } from '../utils/helpers'

/** リマインドの設定と「今日勉強したか」に合わせて、通知の予約を最新にする。画面は出さない */
export default function ReminderScheduler() {
  const { state } = useApp()
  const { reminder, studySessions } = state
  const today = getTodayStr()
  const studiedToday = studySessions.some(s => s.date === today)

  useEffect(() => {
    if (Platform.OS === 'web') return
    syncReminders(reminder, studiedToday)
  }, [reminder, studiedToday, today])

  return null
}
