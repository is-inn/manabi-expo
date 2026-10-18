export type Role = 'parent' | 'child'

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
  subjects: Subject[]
  tasks: Task[]
  studySessions: StudySession[]
  timerState: TimerState
}

export type AppAction =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
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
  | { type: 'START_TIMER'; payload: { subject: string; userId: string } }
  | { type: 'TICK_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'SAVE_SESSION'; payload: StudySession }
  | { type: 'LOGOUT' }
