import { User, Task, StudySession } from '../types'

export const MOCK_USERS: User[] = [
  { id: 'parent-1', name: 'お父さん', role: 'parent', avatar: '👨' },
  { id: 'parent-2', name: 'お母さん', role: 'parent', avatar: '👩' },
  { id: 'child-1', name: 'たろう', role: 'child', avatar: '👦' },
  { id: 'child-2', name: 'はなこ', role: 'child', avatar: '👧' },
]

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: '算数プリント10ページ', subject: '算数', assignedTo: 'child-1', dueDate: '2026-06-15', completed: false, createdAt: '2026-06-01' },
  { id: 't2', title: '漢字ドリル', subject: '国語', assignedTo: 'child-1', dueDate: '2026-06-12', completed: true, createdAt: '2026-06-01' },
  { id: 't3', title: '英単語50個暗記', subject: '英語', assignedTo: 'child-2', dueDate: '2026-06-14', completed: false, createdAt: '2026-06-02' },
]

export const MOCK_SESSIONS: StudySession[] = [
  { id: 's1', userId: 'child-1', subject: '算数', duration: 1800, date: '2026-06-01' },
  { id: 's2', userId: 'child-1', subject: '国語', duration: 1200, date: '2026-06-02' },
  { id: 's3', userId: 'child-1', subject: '算数', duration: 2400, date: '2026-06-03' },
  { id: 's4', userId: 'child-2', subject: '英語', duration: 900, date: '2026-06-02' },
  { id: 's5', userId: 'child-2', subject: '国語', duration: 1500, date: '2026-06-04' },
]

export const SUBJECTS = ['算数', '国語', '英語', '理科', '社会', 'その他']

export const SUBJECT_COLORS: Record<string, string> = {
  算数: '#4f9cf9',
  国語: '#f97b4f',
  英語: '#4fcf8e',
  理科: '#b94ff9',
  社会: '#f9c74f',
  その他: '#9ca3af',
}
