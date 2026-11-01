import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, initializeAuth, type Auth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// ウェブアプリ用の公開設定（秘密ではない。守っているのは Realtime Database のルール）
const firebaseConfig = {
  apiKey: 'AIzaSyAcZDBL_ZQugISummGVrzKNCe-K-0LdOV0',
  authDomain: 'manabi-team.firebaseapp.com',
  databaseURL: 'https://manabi-team-default-rtdb.firebaseio.com',
  projectId: 'manabi-team',
  storageBucket: 'manabi-team.firebasestorage.app',
  messagingSenderId: '288663246685',
  appId: '1:288663246685:web:41acf73b6c077e6865fab4',
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

function createAuth(): Auth {
  if (Platform.OS === 'web') return getAuth(app)
  try {
    // スマホでは、ログイン状態を端末に残す（アプリを閉じても続けて使える）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth')
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  } catch {
    // すでに初期化済み（開発中のリロードなど）
    return getAuth(app)
  }
}

export const auth = createAuth()
export const db = getDatabase(app)
