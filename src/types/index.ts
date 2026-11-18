export type Role = 'parent' | 'child'

/** family = 保護者とこども / solo = ひとりで使う */
export type Mode = 'family' | 'solo'

export interface User {
  id: string
  name: string
  role: Role
  avatar: string
}

export interface Subject {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  title: string
  subject: string
  assignedTo: string
  dueDate: string
  completed: boolean
  createdAt: string
}

export interface StudySession {
  id: string
  userId: string
  subject: string
  duration: number
  date: string
  /** 頑張ったことメモ（ひとりモード） */
  note?: string
}

export interface SoloProfile {
  name: string
  /** 1日の目標（分） */
  goalMinutes: number
}

/** 保護者の学習目標（週あたり） */
export interface GoalSetting {
  userId: string
  title?: string
  /** 1週間の目標（分） */
  weeklyMinutes: number
  /** 期限（YYYY-MM-DD） */
  deadline?: string
}

/** 保護者が子どもに見せる項目（true = 見せる）。未設定の保護者はすべて非公開 */
export interface ParentVisibility {
  total: boolean
  week: boolean
  goal: boolean
  subjects: boolean
  tasks: boolean
  taskTime: boolean
}

export interface TimerState {
  isRunning: boolean
  elapsed: number
  subject: string
  sessionUserId: string
  /** 開始した時刻（ms）。画面を閉じていても経過時間がずれないよう、時刻から計算する */
  startedAt: number
  /** 一時停止した時刻（ms）。動いている間は 0 */
  pausedAt: number
  /** これまでに一時停止していた合計（ms）。経過時間から引く */
  pausedMs: number
  /** カウントダウンの目標秒数。0ならストップウォッチ */
  targetSeconds: number
}

/** 勉強のリマインド通知（この端末だけ。days は日曜=0〜土曜=6） */
export interface ReminderSetting {
  enabled: boolean
  hour: number
  minute: number
  days: boolean[]
}

/** タイマーが終わったときの知らせ方（この端末だけ） */
export interface TimerAlertSetting {
  /** vibrate = バイブだけ / vibrateSound = バイブ＋やわらかい音 */
  sound: 'vibrate' | 'vibrateSound'
  /** 画面を閉じていても通知で知らせる */
  notify: boolean
}

/** 家族コードでつないだ家族（スマホを分けて使う） */
export interface FamilyLink {
  id: string
  /** 家族コード（8文字） */
  code: string
  /** つないだ直後の最初の同期: push = この端末の記録を送る / pull = 家族の記録を受け取る */
  initial?: 'push' | 'pull'
}

/** 家族で共有する部分 */
export type SharedData = Pick<AppState, 'users' | 'subjects' | 'tasks' | 'studySessions' | 'goals' | 'visibility'>

export interface AppState {
  /** 最初に選んだ使い方。まだ選んでいなければ null */
  mode: Mode | null
  /** この端末の持ち主ID。将来の認証連携で「引き継ぎ元」になる（通信はしない） */
  accountId: string
  goals: GoalSetting[]
  visibility: Record<string, ParentVisibility>
  currentUser: User | null
  users: User[]
  solo: SoloProfile
  subjects: Subject[]
  tasks: Task[]
  studySessions: StudySession[]
  reminder: ReminderSetting
  /** 使い方の説明（チュートリアル）を見終えた人のID */
  tutorialSeen: string[]
  timerAlert: TimerAlertSetting
  /** この端末（保護者）で「こどもが勉強したよ」の通知を受け取る。家族コードでつないでいるときだけ使える */
  cheerNotify: boolean
  /** 家族コードでつないでいるとき */
  family: FamilyLink | null
  timerState: TimerState
}

export type AppAction =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'REPLACE_STATE'; payload: Partial<AppState> }
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SET_SOLO_PROFILE'; payload: SoloProfile }
  | { type: 'SET_USER'; payload: User }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { id: string; name: string; avatar: string } }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'UPDATE_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SUBJECT'; payload: string }
  | { type: 'ADD_SUBJECTS'; payload: Subject[] }
  | { type: 'SET_ACCOUNT_ID'; payload: string }
  | { type: 'SET_REMINDER'; payload: ReminderSetting }
  | { type: 'SET_TUTORIAL_SEEN'; payload: { userId: string; seen: boolean } }
  | { type: 'SET_TIMER_ALERT'; payload: TimerAlertSetting }
  | { type: 'SET_CHEER_NOTIFY'; payload: boolean }
  | { type: 'SET_FAMILY'; payload: FamilyLink | null }
  /** 家族のサーバーから届いた共有データで置き換える */
  | { type: 'FAMILY_REMOTE'; payload: SharedData }
  | { type: 'SET_GOAL'; payload: GoalSetting }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_VISIBILITY'; payload: { userId: string; visibility: ParentVisibility } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'START_TIMER'; payload: { subject: string; userId: string; now: number; targetSeconds?: number } }
  | { type: 'TICK_TIMER'; payload: { now: number } }
  | { type: 'PAUSE_TIMER'; payload: { now: number } }
  | { type: 'RESUME_TIMER'; payload: { now: number } }
  | { type: 'STOP_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'SAVE_SESSION'; payload: StudySession }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'LOGOUT' }
