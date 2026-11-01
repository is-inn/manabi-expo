import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useMemo, useState } from 'react'
import { useApp } from '../hooks/AppContext'
import { MAX_SUBJECT_LENGTH, SUBJECT_PALETTE } from '../utils/defaults'
import { QUALIFICATION_GROUPS, WORK_INDUSTRIES } from '../utils/studyOptions'
import { makeId } from '../utils/helpers'

type Tab = 'work' | 'qual' | 'other'

const TAB_LABEL: Record<Tab, string> = { work: '💼 仕事', qual: '📜 資格', other: '✏️ その他' }
/** 検索結果・すべて表示のときの最大件数 */
const MAX_LIST = 60

/** 保護者の勉強の種類を、仕事・資格・その他から選んで科目に追加する。あとから何度でも追加できる */
export default function StudyOptionsPicker() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('work')
  const [industryId, setIndustryId] = useState(WORK_INDUSTRIES[0].id)
  const [groupId, setGroupId] = useState('all')
  const [query, setQuery] = useState('')
  const [free, setFree] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const existing = useMemo(() => new Set(state.subjects.map(s => s.name)), [state.subjects])
  const industry = WORK_INDUSTRIES.find(i => i.id === industryId) ?? WORK_INDUSTRIES[0]

  // 資格: 分野で絞り込み＋文字で検索（同じ名前は1つにまとめる）
  const quals = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    const groups = groupId === 'all' ? QUALIFICATION_GROUPS : QUALIFICATION_GROUPS.filter(g => g.id === groupId)
    const q = query.trim().toLowerCase()
    for (const g of groups) {
      for (const name of g.items) {
        if (seen.has(name) || (q && !name.toLowerCase().includes(q))) continue
        seen.add(name)
        out.push(name)
      }
    }
    return out
  }, [groupId, query])

  const toggle = (name: string) => {
    setMessage('')
    setPicked(p => (p.includes(name) ? p.filter(n => n !== name) : [...p, name]))
  }

  const addNames = (names: string[]) => {
    const fresh = names.filter(n => !existing.has(n))
    if (fresh.length === 0) { setMessage('すでに追加されています'); return }
    const colors = state.subjects.map(s => s.color)
    const subjects = fresh.map(name => {
      const color = SUBJECT_PALETTE.find(c => !colors.includes(c)) ?? SUBJECT_PALETTE[colors.length % SUBJECT_PALETTE.length]
      colors.push(color)
      return { id: makeId('sub'), name, color }
    })
    dispatch({ type: 'ADD_SUBJECTS', payload: subjects })
    setPicked([])
    setFree('')
    setMessage(`${fresh.length}件を科目に追加しました`)
  }

  const chip = (name: string) => {
    const added = existing.has(name)
    const on = picked.includes(name)
    return (
      <TouchableOpacity key={name} disabled={added} onPress={() => toggle(name)}
        style={[styles.chip, on && styles.chipOn, added && styles.chipDone]}>
        <Text style={[styles.chipText, on && styles.chipTextOn, added && styles.chipTextDone]}>{added ? `✓ ${name}` : name}</Text>
      </TouchableOpacity>
    )
  }

  if (!open) {
    return (
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.openBtn}>
        <Text style={styles.openText}>＋ 仕事・資格の勉強を追加</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>勉強の種類を追加</Text>
        <TouchableOpacity onPress={() => { setOpen(false); setPicked([]); setMessage('') }}>
          <Text style={styles.close}>とじる</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.note}>選んだものは科目に入り、タイマーで使えます。仕事と資格の両方も、あとから追加できます。</Text>

      <View style={styles.tabs}>
        {(Object.keys(TAB_LABEL) as Tab[]).map(t => (
          <TouchableOpacity key={t} onPress={() => { setTab(t); setPicked([]); setMessage('') }} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{TAB_LABEL[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'work' && (
        <>
          <Text style={styles.label}>業種</Text>
          <View style={styles.row}>
            {WORK_INDUSTRIES.map(i => (
              <TouchableOpacity key={i.id} onPress={() => { setIndustryId(i.id); setPicked([]) }} style={[styles.chip, industryId === i.id && styles.chipSel]}>
                <Text style={[styles.chipText, industryId === i.id && styles.chipTextOn]}>{i.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>勉強したいこと（複数OK）</Text>
          <View style={styles.row}>{industry.topics.map(chip)}</View>
        </>
      )}

      {tab === 'qual' && (
        <>
          <TextInput value={query} onChangeText={setQuery} placeholder="資格を探す（例：TOEIC、保育士、Linux）" style={styles.input} />
          <View style={styles.row}>
            {[{ id: 'all', label: 'すべて' }, ...QUALIFICATION_GROUPS].map(g => (
              <TouchableOpacity key={g.id} onPress={() => setGroupId(g.id)} style={[styles.chip, groupId === g.id && styles.chipSel]}>
                <Text style={[styles.chipText, groupId === g.id && styles.chipTextOn]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>{quals.slice(0, MAX_LIST).map(chip)}</View>
          {quals.length === 0 && <Text style={styles.note}>見つかりません。「その他」から直接書き込めます。</Text>}
          {quals.length > MAX_LIST && <Text style={styles.note}>ほかに{quals.length - MAX_LIST}件あります。文字で絞り込んでください。</Text>}
        </>
      )}

      {tab === 'other' && (
        <>
          <Text style={styles.label}>勉強したいことを書く</Text>
          <TextInput value={free} onChangeText={setFree} placeholder="例：宅建の過去問、読書" maxLength={MAX_SUBJECT_LENGTH} style={styles.input} />
        </>
      )}

      {tab === 'other' ? (
        <TouchableOpacity onPress={() => addNames([free.trim()])} disabled={!free.trim()} style={[styles.addBtn, !free.trim() && styles.disabled]}>
          <Text style={styles.addText}>追加する</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => addNames(picked)} disabled={picked.length === 0} style={[styles.addBtn, picked.length === 0 && styles.disabled]}>
          <Text style={styles.addText}>{picked.length > 0 ? `${picked.length}件を追加する` : '選んで追加する'}</Text>
        </TouchableOpacity>
      )}
      {message !== '' && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  openBtn: { backgroundColor: '#e8f3fe', borderRadius: 12, padding: 14, alignItems: 'center' },
  openText: { color: '#4f9cf9', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: '#1a202c' },
  close: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  note: { fontSize: 11, color: '#94a3b8', lineHeight: 16 },
  tabs: { flexDirection: 'row', gap: 6, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabOn: { backgroundColor: 'white' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextOn: { color: '#4f9cf9' },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9' },
  chipSel: { backgroundColor: '#4f9cf9' },
  chipOn: { backgroundColor: '#4fcf8e' },
  chipDone: { backgroundColor: '#f8fafc' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextOn: { color: 'white' },
  chipTextDone: { color: '#cbd5e1' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14 },
  addBtn: { backgroundColor: '#4f9cf9', padding: 12, borderRadius: 10, alignItems: 'center' },
  addText: { color: 'white', fontWeight: '700' },
  disabled: { opacity: 0.45 },
  message: { fontSize: 12, color: '#1e8e5a', textAlign: 'center' },
})
