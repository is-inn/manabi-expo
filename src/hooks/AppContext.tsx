import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { AppState, AppAction } from '../types'
import { MOCK_USERS, MOCK_TASKS, MOCK_SESSIONS } from '../utils/mockData'

const STORAGE_KEY = 'manabi:appState:v1'

const initialState: AppState = {
  currentUser: null,
  users: MOCK_USERS,
  tasks: MOCK_TASKS,
  studySessions: MOCK_SESSIONS,
  timerState: { isRunning: false, elapsed: 0, subject: '', sessionUserId: '' },
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE': return { ...state, ...action.payload }
    case 'SET_USER': return { ...state, currentUser: action.payload }
    case 'ADD_TASK': return { ...state, tasks: [...state.tasks, action.payload] }
    case 'TOGGLE_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, completed: !t.completed } : t) }
    case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }
    case 'START_TIMER': return { ...state, timerState: { isRunning: true, elapsed: 0, subject: action.payload.subject, sessionUserId: action.payload.userId } }
    case 'TICK_TIMER': return { ...state, timerState: { ...state.timerState, elapsed: state.timerState.elapsed + 1 } }
    case 'STOP_TIMER': return { ...state, timerState: { ...state.timerState, isRunning: false } }
    case 'SAVE_SESSION': return { ...state, studySessions: [...state.studySessions, action.payload], timerState: { isRunning: false, elapsed: 0, subject: '', sessionUserId: '' } }
    case 'LOGOUT': return { ...state, currentUser: null }
    default: return state
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | null>(null)

/** 永続化する部分だけを抜き出す（users は静的、timerState は揮発でよい） */
type Persisted = Pick<AppState, 'currentUser' | 'tasks' | 'studySessions'>

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
          dispatch({ type: 'HYDRATE', payload: saved })
        }
      } catch (e) {
        // 破損データは無視して初期値で起動する（クラッシュさせない）
        console.warn('[AppContext] hydrate failed, falling back to defaults', e)
        try { await AsyncStorage.removeItem(STORAGE_KEY) } catch {}
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // 変更のたびに保存する（hydrate 完了前は保存しない＝初期値の上書き防止）
  useEffect(() => {
    if (!hydrated) return
    const persisted: Persisted = {
      currentUser: state.currentUser,
      tasks: state.tasks,
      studySessions: state.studySessions,
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(e =>
      console.warn('[AppContext] persist failed', e)
    )
  }, [hydrated, state.currentUser, state.tasks, state.studySessions])

  // タイマー
  useEffect(() => {
    if (!state.timerState.isRunning) return
    const id = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 1000)
    return () => clearInterval(id)
  }, [state.timerState.isRunning])

  // 読み込み完了までモックデータを描画しない
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
