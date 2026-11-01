import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useApp } from '../../src/hooks/AppContext'
import { getTodayStr, getSubjectColor } from '../../src/utils/helpers'
import { avatarAsText } from '../../src/utils/avatar'
import { Task } from '../../src/types'

export default function ParentTasks() {
  const { state, dispatch } = useApp()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const children = state.users.filter(u => u.role === 'child')
  // 科目が消された／未選択のときは先頭の科目、こどもが1人だけなら自動でその子
  const subjectName = state.subjects.some(s => s.name === subject) ? subject : (state.subjects[0]?.name ?? '')
  const assigneeId = assignedTo || (children.length === 1 ? children[0].id : '')

  const handleAdd = () => {
    if (!title.trim() || !assigneeId || !subjectName) return
    const task: Task = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      subject: subjectName,
      assignedTo: assigneeId,
      dueDate: getTodayStr(),
      completed: false,
      createdAt: getTodayStr(),
    }
    dispatch({ type: 'ADD_TASK', payload: task })
    setTitle('')
    setAdding(false)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>✅ タスク管理</Text>
          <TouchableOpacity onPress={() => setAdding(!adding)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{adding ? 'キャンセル' : '＋ 追加'}</Text>
          </TouchableOpacity>
        </View>

        {adding && (
          <View style={styles.formCard}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="タスク名を入力"
              style={styles.input}
            />
            <Text style={styles.formLabel}>科目</Text>
            <View style={styles.subjectRow}>
              {state.subjects.map(s => (
                <TouchableOpacity key={s.id} onPress={() => setSubject(s.name)}
                  style={[styles.subjectBtn, { backgroundColor: subjectName === s.name ? s.color : '#f1f5f9' }]}>
                  <Text style={[styles.subjectText, { color: subjectName === s.name ? 'white' : '#64748b' }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.formLabel}>担当者</Text>
            {children.length === 0 && (
              <Text style={styles.metaText}>先に「設定」タブでこどもを登録してください</Text>
            )}
            <View style={styles.subjectRow}>
              {children.map(c => (
                <TouchableOpacity key={c.id} onPress={() => setAssignedTo(c.id)}
                  style={[styles.subjectBtn, { backgroundColor: assigneeId === c.id ? '#4f9cf9' : '#f1f5f9' }]}>
                  <Text style={[styles.subjectText, { color: assigneeId === c.id ? 'white' : '#64748b' }]}>{avatarAsText(c.avatar)} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleAdd} style={styles.submitBtn}>
              <Text style={styles.submitText}>タスクを追加</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.tasks.map(task => {
          const assignee = state.users.find(u => u.id === task.assignedTo)
          return (
            <View key={task.id} style={[styles.taskCard, task.completed && styles.taskDone]}>
              <TouchableOpacity
                style={[styles.checkbox, task.completed && styles.checkboxDone]}
                onPress={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
              >
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
                <View style={styles.taskMeta}>
                  <View style={[styles.badge, { backgroundColor: `${getSubjectColor(state.subjects, task.subject)}22` }]}>
                    <Text style={[styles.badgeText, { color: getSubjectColor(state.subjects, task.subject) }]}>{task.subject}</Text>
                  </View>
                  {assignee && <Text style={styles.metaText}>{avatarAsText(assignee.avatar)} {assignee.name}</Text>}
                </View>
              </View>
              <TouchableOpacity onPress={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}>
                <Text style={styles.deleteBtn}>×</Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  container: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '700' },
  addBtn: { backgroundColor: '#4f9cf9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  formCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14 },
  formLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  subjectText: { fontSize: 12, fontWeight: '600' },
  submitBtn: { backgroundColor: '#4f9cf9', padding: 12, borderRadius: 10, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '700' },
  taskCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  taskDone: { opacity: 0.7 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#4fcf8e', borderColor: '#4fcf8e' },
  checkmark: { color: 'white', fontSize: 12, fontWeight: '700' },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 11, color: '#94a3b8' },
  deleteBtn: { fontSize: 20, color: '#cbd5e1', padding: 4 },
})
