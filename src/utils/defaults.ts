import { ParentVisibility, ReminderSetting, Subject, TimerAlertSetting } from '../types'

/** タイマー終了の知らせ方の初期値（バイブだけ・通知でも知らせる） */
export const DEFAULT_TIMER_ALERT: TimerAlertSetting = { sound: 'vibrate', notify: true }

/** リマインド通知の初期値（オフ。オンにすると毎日19:00） */
export const DEFAULT_REMINDER: ReminderSetting = { enabled: false, hour: 19, minute: 0, days: [true, true, true, true, true, true, true] }

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

/** 保護者の週あたりの目標（分）の初期値と上限 */
export const DEFAULT_WEEKLY_GOAL_MINUTES = 300
export const MAX_WEEKLY_GOAL_MINUTES = 3000
export const MAX_GOAL_TITLE_LENGTH = 20

/** 子どもに見せる項目（キー順が表示順） */
export const VISIBILITY_ITEMS: { key: keyof ParentVisibility; label: string; desc: string }[] = [
  { key: 'total', label: '累計の学習時間', desc: 'これまでの合計' },
  { key: 'week', label: '今週の学習時間', desc: '月曜からの合計' },
  { key: 'goal', label: '目標と達成率', desc: '週の目標に対する進み具合' },
  { key: 'subjects', label: '学習している科目', desc: '科目の名前' },
  { key: 'tasks', label: 'タスクの内容', desc: '自分に出しているタスク' },
  { key: 'taskTime', label: 'タスクごとの学習時間', desc: '科目ごとの勉強時間' },
]

/** 非公開（未設定の保護者・移行した保護者の初期値） */
export const ALL_PRIVATE: ParentVisibility = { total: false, week: false, goal: false, subjects: false, tasks: false, taskTime: false }

/** 科目セット。「追加」では同名の科目はスキップされる */
export const SUBJECT_PRESETS: { id: string; label: string; group: string; subjects: string[] }[] = [
  { id: 'jh5', label: '中学 5教科', group: '中学', subjects: ['国語', '数学', '英語', '理科', '社会'] },
  { id: 'jh9', label: '中学 9教科', group: '中学', subjects: ['国語', '数学', '英語', '理科', '社会', '音楽', '美術', '保健体育', '技術家庭'] },
  { id: 'hs5', label: '高校 5教科', group: '高校', subjects: ['国語', '数学', '英語', '理科', '地歴公民'] },
  { id: 'common', label: '共通テスト', group: '高校', subjects: ['国語', '地歴公民', '数学', '理科', '外国語', '情報Ⅰ'] },
  { id: 'jhexam', label: '中学受験', group: '受験', subjects: ['国語', '算数', '理科', '社会'] },
  { id: 'hsexam3', label: '高校受験 3教科', group: '受験', subjects: ['国語', '数学', '英語'] },
  { id: 'hsexam5', label: '高校受験 5教科', group: '受験', subjects: ['国語', '数学', '英語', '理科', '社会'] },
  { id: 'univ-l', label: '大学受験 文系', group: '受験', subjects: ['国語', '英語', '数学', '日本史', '世界史', '地理'] },
  { id: 'univ-s', label: '大学受験 理系', group: '受験', subjects: ['国語', '英語', '数学', '物理', '化学', '生物'] },
]

export const MAX_NAME_LENGTH = 10
export const MAX_SUBJECT_LENGTH = 20
