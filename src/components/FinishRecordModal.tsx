import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, Modal, Image, StyleSheet } from 'react-native'
import { formatDuration } from '../utils/helpers'
import { pickStudyPhoto, PhotoSource } from '../utils/studyPhoto'

const MAX_NOTE_LENGTH = 200

interface Props {
  visible: boolean
  subject: string
  /** 勉強した秒数 */
  duration: number
  onSave: (note: string | undefined, photo: string | undefined) => void
  onDiscard: () => void
}

/** 勉強が終わったときの「がんばったこと（メモ）」と写真。どちらも書かなくてOK */
export default function FinishRecordModal({ visible, subject, duration, onSave, onDiscard }: Props) {
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => { setNote(''); setPhoto(null) }
  const save = () => { onSave(note.trim() || undefined, photo ?? undefined); reset() }
  const discard = () => { onDiscard(); reset() }

  const add = async (source: PhotoSource) => {
    if (busy) return
    setBusy(true)
    try {
      const p = await pickStudyPhoto(source)
      if (p) setPhoto(p)
    } catch { /* 写真が選べなくても記録はできる */ }
    setBusy(false)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={discard}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>おつかれさま！🎉</Text>
          <Text style={styles.summary}>{subject}　{formatDuration(duration)}</Text>
          <Text style={styles.label}>がんばったこと（書いても書かなくてもOK）</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="例：英単語を30個おぼえた"
            maxLength={MAX_NOTE_LENGTH}
            multiline
            style={styles.input}
          />
          <Text style={styles.label}>写真（1まいまで・つけなくてもOK）</Text>
          {photo ? (
            <View style={styles.photoRow}>
              <Image source={{ uri: photo }} style={styles.preview} />
              <TouchableOpacity onPress={() => setPhoto(null)} style={styles.remove}>
                <Text style={styles.removeText}>✕ はずす</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoRow}>
              <TouchableOpacity onPress={() => add('camera')} disabled={busy} style={[styles.photoBtn, busy && styles.off]}>
                <Text style={styles.photoBtnText}>📷 とる</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => add('library')} disabled={busy} style={[styles.photoBtn, busy && styles.off]}>
                <Text style={styles.photoBtnText}>🖼️ アルバムからえらぶ</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={discard} style={[styles.btn, styles.discard]}>
              <Text style={styles.discardText}>きろくしない</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} style={[styles.btn, styles.save]}>
              <Text style={styles.saveText}>きろくする</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, gap: 10 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a202c', textAlign: 'center' },
  summary: { fontSize: 16, fontWeight: '700', color: '#4f9cf9', textAlign: 'center' },
  label: { fontSize: 13, color: '#64748b' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  photoBtn: { backgroundColor: '#eef6ff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  photoBtnText: { color: '#2b6cb0', fontWeight: '700', fontSize: 13 },
  off: { opacity: 0.45 },
  preview: { width: 96, height: 96, borderRadius: 10, backgroundColor: '#f1f5f9' },
  remove: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  removeText: { color: '#64748b', fontWeight: '700', fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  discard: { backgroundColor: '#f1f5f9' },
  discardText: { color: '#64748b', fontWeight: '700' },
  save: { backgroundColor: '#4fcf8e' },
  saveText: { color: 'white', fontWeight: '700' },
})
