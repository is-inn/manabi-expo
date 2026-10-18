import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'

interface Props {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** 削除などの確認。Alert は Web で動かないので Modal で作っている */
export default function ConfirmModal({ visible, title, message, confirmLabel = '削除する', onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onCancel} style={[styles.btn, styles.cancel]}>
              <Text style={styles.cancelText}>やめる</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.btn, styles.confirm]}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  message: { fontSize: 13, color: '#64748b', lineHeight: 19 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#f1f5f9' },
  cancelText: { color: '#64748b', fontWeight: '700' },
  confirm: { backgroundColor: '#ef4444' },
  confirmText: { color: 'white', fontWeight: '700' },
})
