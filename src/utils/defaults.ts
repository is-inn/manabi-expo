import { Subject } from '../types'

/** 初回起動時の科目（あとから自由に追加・編集・削除できる） */
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-math', name: '算数', color: '#4f9cf9' },
  { id: 'sub-japanese', name: '国語', color: '#f97b4f' },
  { id: 'sub-english', name: '英語', color: '#4fcf8e' },
  { id: 'sub-science', name: '理科', color: '#b94ff9' },
  { id: 'sub-social', name: '社会', color: '#f9c74f' },
  { id: 'sub-other', name: 'その他', color: '#9ca3af' },
]

export const SUBJECT_PALETTE = ['#4f9cf9', '#f97b4f', '#4fcf8e', '#b94ff9', '#f9c74f', '#ef6f9b', '#2bb5c9', '#9ca3af']

/** 科目が削除済みなど、色が引けないときの色 */
export const FALLBACK_SUBJECT_COLOR = '#9ca3af'

export const AVATARS = ['👨', '👩', '👴', '👵', '👦', '👧', '🧒', '👶', '🐱', '🐶', '🐰', '🐻', '🦊', '🐼']

/** ひとりモードの学習記録に付ける userId */
export const SOLO_USER_ID = 'solo'
export const DEFAULT_GOAL_MINUTES = 60
export const MAX_GOAL_MINUTES = 600
/** カウントダウンタイマーの候補（分） */
export const TIMER_PRESETS = [10, 15, 25, 45, 60]

export const MAX_NAME_LENGTH = 10
export const MAX_SUBJECT_LENGTH = 8
