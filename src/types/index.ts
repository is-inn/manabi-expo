export type Role = 'parent' | 'child'

export interface User {
  id: string
  name: string
  role: Role
  avatar: string
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
}

export interface TimerState {
  isRunning: boolean
  elapsed: number
  subject: string
  sessionUserId: string
}

export interface AppState {
  currentUser: User | null
  users: User[]
  tasks: Task[]
  studySessions: StudySession[]
  timerState: TimerState
}

export type AppAction =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_USER'; payload: User }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'START_TIMER'; payload: { subject: string; userId: string } }
  | { type: 'TICK_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'SAVE_SESSION'; payload: StudySession }
  | { type: 'LOGOUT' }
