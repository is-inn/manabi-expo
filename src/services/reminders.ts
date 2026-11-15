import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { ReminderSetting } from '../types'

const CHANNEL_ID = 'reminder'
/** 先の何日分まで予約するか（アプリを開くたびに予約し直す） */
const DAYS_AHEAD = 14

/** タイマー終了の通知のID（reminders 側では消さない） */
const TIMER_NOTIFICATION_ID = 'timer-end'

Notifications.setNotificationHandler({
  handleNotification: async n => {
    // アプリを開いているときのタイマー終了は、アプリの中でバイブ・音を出すので、通知は出さない
    const isTimer = (n.request.content.data as { kind?: string } | undefined)?.kind === 'timer'
    return isTimer
      ? { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }
      : { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }
  },
})

/** リマインドの予約だけを消す（タイマー終了の予約は残す） */
async function cancelReminders() {
  const all = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(all
    .filter(n => n.identifier !== TIMER_NOTIFICATION_ID)
    .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})))
}

/** 通知の許可を確かめる。まだ聞いていなければ聞く。許可されたら true */
export async function ensureReminderPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync()
    if (cur.granted) return true
    if (!cur.canAskAgain) return false
    return (await Notifications.requestPermissionsAsync()).granted
  } catch {
    return false
  }
}

/**
 * 予約をすべて消して、設定に合わせて先の日付分を予約し直す。
 * 今日すでに勉強していたら、今日の分は予約しない。
 */
export async function syncReminders(setting: ReminderSetting, studiedToday: boolean): Promise<void> {
  try {
    await cancelReminders()
    if (!setting.enabled) return
    if (!(await Notifications.getPermissionsAsync()).granted) return
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: '勉強のリマインド', importance: Notifications.AndroidImportance.DEFAULT })
    }
    const now = new Date()
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, setting.hour, setting.minute, 0)
      if (at.getTime() <= now.getTime()) continue
      if (i === 0 && studiedToday) continue
      if (!setting.days[at.getDay()]) continue
      await Notifications.scheduleNotificationAsync({
        content: { title: '📖 勉強の時間だよ', body: '今日も少しだけ、はじめてみよう！' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
      })
    }
  } catch {
    // 通知が使えない環境でも、アプリ本体は止めない
  }
}
