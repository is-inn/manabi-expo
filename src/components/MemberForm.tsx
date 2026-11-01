import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { ParentVisibility, Role } from '../types'
import { ALL_PRIVATE, AVATARS, MAX_NAME_LENGTH } from '../utils/defaults'
import VisibilitySwitches from './VisibilitySwitches'
import Avatar from './Avatar'
import { isPhotoAvatar, pickPhotoAvatar } from '../utils/avatar'

export interface MemberValue {
  name: string
  avatar: string
  role: Role
  /** 新しく保護者を登録するときだけ入る（子どもに見せる項目） */
  visibility?: ParentVisibility
}

interface Props {
  initial?: MemberValue
  defaultRole?: Role
  /** 編集時は役割を変えさせない（タスクや記録の持ち主が崩れるため） */
  lockRole?: boolean
  submitLabel: string
  onSubmit: (value: MemberValue) => void
  onCancel?: () => void
}

const ROLE_LABEL: Record<Role, string> = { parent: '保護者', child: 'こども' }

export default function MemberForm({ initial, defaultRole = 'child', lockRole, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[defaultRole === 'parent' ? 0 : 4])
  const [role, setRole] = useState<Role>(initial?.role ?? defaultRole)
  const [photoError, setPhotoError] = useState('')
  const [visibility, setVisibility] =useState<ParentVisibility>(ALL_PRIVATE)
  const trimmed = name.trim()
  const askVisibility = !initial && role === 'parent'

  const submit = () => {
    if (!trimmed) return
    onSubmit({ name: trimmed, avatar, role, ...(askVisibility ? { visibility } : {}) })
    if (!initial) { setName(''); setVisibility(ALL_PRIVATE) }
  }

  return (
    <View style={styles.card}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="なまえ（例：たろう）"
        maxLength={MAX_NAME_LENGTH}
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <Text style={styles.label}>役割</Text>
      {lockRole ? (
        <Text style={styles.fixedRole}>{ROLE_LABEL[role]}</Text>
      ) : (
        <View style={styles.row}>
          {(['parent', 'child'] as Role[]).map(r => (
            <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.chip, role === r && styles.chipOn]}>
              <Text style={[styles.chipText, role === r && styles.chipTextOn]}>{ROLE_LABEL[r]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>アイコン</Text>
      <View style={styles.row}>
        {AVATARS.map(a => (
          <TouchableOpacity key={a} onPress={() => setAvatar(a)} style={[styles.avatarBtn, avatar === a && styles.avatarOn]}>
            <Text style={styles.avatarText}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.photoRow}>
        {isPhotoAvatar(avatar) && (
          <View style={[styles.avatarBtn, styles.avatarOn]}>
            <Avatar avatar={avatar} size={36} />
          </View>
        )}
        <TouchableOpacity
          onPress={async () => {
            setPhotoError('')
            try {
              const uri = await pickPhotoAvatar()
              if (uri) setAvatar(uri)
            } catch {
              setPhotoError('写真を読み込めませんでした。もう一度ためしてください。')
            }
          }}
          style={styles.photoBtn}
        >
          <Text style={styles.photoBtnText}>📷 {isPhotoAvatar(avatar) ? '写真をえらびなおす' : '自分の写真からえらぶ'}</Text>
        </TouchableOpacity>
      </View>
      {photoError !== '' && <Text style={styles.photoError}>{photoError}</Text>}

      {askVisibility && (
        <>
          <Text style={styles.label}>子どもに見せる学習状況（あとで変えられます）</Text>
          <VisibilitySwitches value={visibility} onChange={setVisibility} />
        </>
      )}

      <View style={styles.btnRow}>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={[styles.btn, styles.cancel]}>
            <Text style={styles.cancelText}>やめる</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={submit} disabled={!trimmed} style={[styles.btn, styles.submit, !trimmed && styles.disabled]}>
          <Text style={styles.submitText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  fixedRole: { fontSize: 13, fontWeight: '600', color: '#1a202c' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  chipOn: { backgroundColor: '#4f9cf9' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextOn: { color: 'white' },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 2, borderColor: 'transparent' },
  avatarOn: { borderColor: '#4f9cf9', backgroundColor: '#e8f3fe' },
  avatarText: { fontSize: 22 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#4f9cf9' },
  photoError: { fontSize: 11, color: '#f97b4f' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#f1f5f9' },
  cancelText: { color: '#64748b', fontWeight: '700' },
  submit: { backgroundColor: '#4f9cf9' },
  submitText: { color: 'white', fontWeight: '700' },
  disabled: { opacity: 0.45 },
})
