import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { AppState, AppAction, TimerState } from '../types'
import { DEFAULT_SUBJECTS } from '../utils/defaults'

const STORAGE_KEY = 'manabi:appState:v2'
// v1 はデモ家族入りの旧形式。読み込まずに掃除だけする
const LEGACY_STORAGE_KEY = 'manabi:appState:v1'

const IDLE_TIMER: TimerState = { isRunning: false, elapsed: 0, subject: '', sessionUserId: '' }

const initialState: AppState = {
  currentUser: null,
  users: [],
  subjects: DEFAULT_SUBJECTS,
  tasks: [],
  studySessions: [],
  timerState: IDLE_TIMER,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE': return { ...state, ...action.payload }
    case 'SET_USER': return { ...state, currentUser: action.payload }
    case 'ADD_USER': return { ...state, users: [...state.users, action.payload] }
    case 'UPDATE_USER': {
      const { id, name, avatar } = action.payload
      const apply = <T extends { id: string; name: string; avatar: string }>(u: T): T => u.id === id ? { ...u, name, avatar } : u
      return {
        ...state,
        users: state.users.map(apply),
        currentUser: state.currentUser ? apply(state.currentUser) : null,
      }
    }
    case 'DELETE_USER': {
      const id = action.payload
      return {
        ...state,
        users: state.users.filter(u => u.id !== id),
        tasks: state.tasks.filter(t => t.assignedTo !== id),
        studySessions: state.studySessions.filter(s => s.userId !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
        timerState: state.timerState.sessionUserId === id ? IDLE_TIMER : state.timerState,
      }
    }
    case 'ADD_SUBJECT': {
      // タスクや記録は科目名で紐づくので、同じ名前は作らせない
      if (state.subjects.some(s => s.name === action.payload.name)) return state
      return { ...state, subjects: [...state.subjects, action.payload] }
    }
    case 'UPDATE_SUBJECT': {
      const next = action.payload
      const prev = state.subjects.find(s => s.id === next.id)
      if (!prev) return state
      if (next.name !== prev.name && state.subjects.some(s => s.name === next.name)) return state
      // 名前を変えたら、既存のタスク・記録の科目名も追従させる
      const rename = (name: string) => (name === prev.name ? next.name : name)
      return {
        ...state,
        subjects: state.subjects.map(s => s.id === next.id ? next : s),
        tasks: state.tasks.map(t => ({ ...t, subject: rename(t.subject) })),
        studySessions: state.studySessions.map(s => ({ ...s, subject: rename(s.subject) })),
        timerState: { ...state.timerState, subject: rename(state.timerState.subject) },
      }
    }
    case 'DELETE_SUBJECT': {
      if (state.subjects.length <= 1) return state
      return { ...state, subjects: state.subjects.filter(s => s.id !== action.payload) }
    }
    case 'ADD_TASK': return { ...state, tasks: [...state.tasks, action.payload] }
    case 'TOGGLE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, completed: !t.completed } : t) }
    case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }
    case 'START_TIMER': return { ...state, timerState: { isRunning: true, elapsed: 0, subject: action.payload.subject, sessionUserId: action.payload.userId } }
    case 'TICK_TIMER': return { ...state, timerState: { ...state.timerState, elapsed: state.timerState.elapsed + 1 } }
    case 'STOP_TIMER': return { ...state, timerState: { ...state.timerState, isRunning: false } }
    case 'SAVE_SESSION': return { ...state, studySessions: [...state.studySessions, action.payload], timerState: IDLE_TIMER }
    case 'LOGOUT': return { ...state, currentUser: null }
    default: return state
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | null>(null)

/** 永続化する部分だけを抜き出す（timerState は揮発でよい） */
type Persisted = Pick<AppState, 'currentUser' | 'users' | 'subjects' | 'tasks' | 'studySessions'>

/** 保存データの形を確かめて、使えるものだけ取り出す（壊れていても落とさない） */
function sanitize(saved: Partial<Persisted>): Partial<Persisted> {
  const out: Partial<Persisted> = {}
  if (Array.isArray(saved.users)) out.users = saved.users
  if (Array.isArray(saved.subjects) && saved.subjects.length > 0) out.subjects = saved.subjects
  if (Array.isArray(saved.tasks)) out.tasks = saved.tasks
  if (Array.isArray(saved.studySessions)) out.studySessions = saved.studySessions
  const me = saved.currentUser
  if (me && out.users?.some(u => u.id === me.id)) out.currentUser = me
  return out
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)

  // 起動時に保存済みデータを読み込む
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (!cancelled && raw) {
          const saved = JSON.parse(raw) as Partial<Persisted>
          dispatch({ type: 'HYDRATE', payload: sanitize(saved) })
        }
      } catch (e) {
        // 破損データは無視して初期値で起動する（クラッシュさせない）
        console.warn('[AppContext] hydrate failed, falling back to defaults', e)
        try { await AsyncStorage.removeItem(STORAGE_KEY) } catch {}
      } finally {
        if (!cancelled) setHydrated(true)
      }
      AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {})
    })()
    return () => { cancelled = true }
  }, [])

  // 変更のたびに保存する（hydrate 完了前は保存しない＝初期値の上書き防止）
  useEffect(() => {
    if (!hydrated) return
    const persisted: Persisted = {
      currentUser: state.currentUser,
      users: state.users,
      subjects: state.subjects,
      tasks: state.tasks,
      studySessions: state.studySessions,
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(e =>
      console.warn('[AppContext] persist failed', e)
    )
  }, [hydrated, state.currentUser, state.users, state.subjects, state.tasks, state.studySessions])

  // タイマー
  useEffect(() => {
    if (!state.timerState.isRunning) return
    const id = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000)
    return () => clearInterval(id)
  }, [state.timerState.isRunning])

  // 読み込み完了まで初期値を描画しない
  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4f9cf9" />
      </View>
    )
  }

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4ff' },
})

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
