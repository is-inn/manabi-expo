import { Platform, Vibration } from 'react-native'
import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import { TimerAlertSetting } from '../types'

/** タイマー終了の通知は、いつも同じIDで1つだけ予約する（やり直すときは上書き） */
export const TIMER_NOTIFICATION_ID = 'timer-end'
const CHANNEL_VIBRATE = 'timer-vibrate'
const CHANNEL_CHIME = 'timer-chime'
const CHIME_FILE = 'chime.wav'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** 「ブブッ」と短く2回ふるえる */
async function buzz() {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 180, 120, 180])
    return
  }
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  await sleep(220)
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  await sleep(160)
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
}

/** やわらかい「ポポン」。マナーモードのときは鳴らさない */
async function chime() {
  await setAudioModeAsync({ playsInSilentMode: false })
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const player = createAudioPlayer(require('../../assets/sounds/chime.wav'))
  player.volume = 0.6
  player.play()
  setTimeout(() => { try { player.remove() } catch {} }, 2000)
}

/** アプリを開いているときに、タイマーの終わりを知らせる */
export async function playTimerEndAlert(setting: TimerAlertSetting): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    if (setting.sound === 'vibrateSound') chime().catch(() => {})
    await buzz()
  } catch {
    // 知らせが使えない端末でも、タイマー自体は止めない
  }
}

async function ensureChannels() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(CHANNEL_VIBRATE, {
    name: 'タイマーのおわり（バイブ）', importance: Notifications.AndroidImportance.HIGH,
    sound: null, vibrationPattern: [0, 180, 120, 180], enableVibrate: true,
  })
  await Notifications.setNotificationChannelAsync(CHANNEL_CHIME, {
    name: 'タイマーのおわり（やわらかい音）', importance: Notifications.AndroidImportance.HIGH,
    sound: CHIME_FILE, vibrationPattern: [0, 180, 120, 180], enableVibrate: true,
  })
}

/** タイマーが終わる時刻に通知を予約する（画面を閉じていても届く） */
export async function scheduleTimerEnd(endAt: number, subject: string, setting: TimerAlertSetting): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID).catch(() => {})
    if (!setting.notify || endAt <= Date.now()) return
    if (!(await Notifications.getPermissionsAsync()).granted) return
    await ensureChannels()
    const withSound = setting.sound === 'vibrateSound'
    await Notifications.scheduleNotificationAsync({
      identifier: TIMER_NOTIFICATION_ID,
      content: {
        title: '⏰ タイマーがおわったよ',
        body: `${subject ? `${subject}　` : ''}おつかれさま！アプリをひらいて記録しよう。`,
        // iPhone は音なしの通知ではふるえないため、「バイブだけ」は音なしの通知で知らせる
        sound: withSound ? CHIME_FILE : false,
        data: { kind: 'timer' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endAt),
        channelId: withSound ? CHANNEL_CHIME : CHANNEL_VIBRATE,
      },
    })
  } catch {
    // 通知が使えない環境でも、アプリ本体は止めない
  }
}

export async function cancelTimerEnd(): Promise<void> {
  if (Platform.OS === 'web') return
  try { await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID) } catch {}
}
