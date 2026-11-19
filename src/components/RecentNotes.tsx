import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native'
import { formatDuration, getSubjectColor } from '../utils/helpers'
import { StudySession, Subject } from '../types'

interface Props {
  sessions: StudySession[]
  subjects: Subject[]
  /** 何件まで出すか（メモか写真のある記録だけ・新しい順） */
  limit?: number
  title?: string
}

/** 最近の「がんばったこと」メモと写真（こどもの記録を保護者が見る／自分の記録を見る） */
export default function RecentNotes({ sessions, subjects, limit = 5, title = '📝 最近のがんばり' }: Props) {
  const [big, setBig] = useState<string | null>(null)
  const items = sessions.filter(s => s.note || s.photo).slice(-limit).reverse()
  if (items.length === 0) return null
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {items.map(s => (
        <View key={s.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: getSubjectColor(subjects, s.subject) }]} />
          <View style={styles.body}>
            <Text style={styles.head}>{s.subject}・{formatDuration(s.duration)}　<Text style={styles.date}>{s.date}</Text></Text>
            {s.note ? <Text style={styles.note}>{s.note}</Text> : null}
            {s.photo ? (
              <TouchableOpacity onPress={() => setBig(s.photo!)}>
                <Image source={{ uri: s.photo }} style={styles.thumb} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ))}
      <Modal visible={big !== null} transparent animationType="fade" onRequestClose={() => setBig(null)}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={() => setBig(null)}>
          {big ? <Image source={{ uri: big }} style={styles.bigImg} resizeMode="contain" /> : null}
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  body: { flex: 1, gap: 2 },
  head: { fontSize: 13, fontWeight: '700', color: '#1a202c' },
  date: { fontSize: 11, color: '#94a3b8', fontWeight: '400' },
  note: { fontSize: 13, color: '#475569', lineHeight: 18 },
  thumb: { width: 96, height: 96, borderRadius: 10, marginTop: 4, backgroundColor: '#f1f5f9' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.8)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  bigImg: { width: '100%', height: '80%' },
})
