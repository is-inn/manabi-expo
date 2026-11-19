import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp } from '../../src/hooks/AppContext'
import { getSubjectColor, isRepeating, isTaskDone, isTaskForDay, repeatLabel } from '../../src/utils/helpers'

export default function ChildTasks() {
  const { state, dispatch } = useApp()
  const user = state.currentUser
  if (!user) return null

  // くり返しタスクは、やる曜日の日だけ出す
  const tasks = state.tasks.filter(t => t.assignedTo === user.id && isTaskForDay(t))
  const done = tasks.filter(t => isTaskDone(t)).length

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>📝 タスク</Text>
          <Text style={styles.progress}>{done}/{tasks.length} 完了</Text>
        </View>

        {tasks.length > 0 && (
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(done / tasks.length) * 100}%` as any }]} />
          </View>
        )}

        {tasks.length === 0 && (
          <Text style={styles.empty}>タスクがありません 🎉</Text>
        )}

        {tasks.map(task => {
          const isDone = isTaskDone(task)
          return (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, isDone && styles.taskCardDone]}
              onPress={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
            >
              <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{task.title}</Text>
                <View style={styles.taskMeta}>
                  <View style={[styles.subjectBadge, { backgroundColor: `${getSubjectColor(state.subjects, task.subject)}22` }]}>
                    <Text style={[styles.subjectText, { color: getSubjectColor(state.subjects, task.subject) }]}>{task.subject}</Text>
                  </View>
                  <Text style={styles.dueDate}>{isRepeating(task) ? `🔁 ${repeatLabel(task.repeatDays!)}` : `📅 ${task.dueDate}`}</Text>
                </View>
              </View>
            </TouchableOpacity>
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
  progress: { fontSize: 13, color: '#64748b' },
  progressBarBg: { backgroundColor: '#f1f5f9', borderRadius: 99, height: 6 },
  progressBarFill: { backgroundColor: '#4fcf8e', height: '100%', borderRadius: 99 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: 32 },
  taskCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  taskCardDone: { opacity: 0.7 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: '#4fcf8e', borderColor: '#4fcf8e' },
  checkmark: { color: 'white', fontSize: 12, fontWeight: '700' },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#1a202c' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  subjectBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  subjectText: { fontSize: 11, fontWeight: '600' },
  dueDate: { fontSize: 11, color: '#94a3b8' },
})
