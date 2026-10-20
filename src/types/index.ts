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

export interface TimerState {
  isRunning: boolean
  elapsed: number
  subject: string
  sessionUserId: string
  /** 開始した時刻（ms）。画面を閉じていても経過時間がずれないよう、時刻から計算する */
  startedAt: number
  /** カウントダウンの目標秒数。0ならストップウォッチ */
  targetSeconds: number
}

export interface AppState {
  /** 最初に選んだ使い方。まだ選んでいなければ null */
  mode: Mode | null
  currentUser: User | null
  users: User[]
  solo: SoloProfile
  subjects: Subject[]
  tasks: Task[]
  studySessions: StudySession[]
  timerState: TimerState
}

export type AppAction =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SET_SOLO_PROFILE'; payload: SoloProfile }
  | { type: 'SET_USER'; payload: User }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { id: string; name: string; avatar: string } }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'UPDATE_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SUBJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'START_TIMER'; payload: { subject: string; userId: string; now: number; targetSeconds?: number } }
  | { type: 'TICK_TIMER'; payload: { now: number } }
  | { type: 'STOP_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'SAVE_SESSION'; payload: StudySession }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'LOGOUT' }
