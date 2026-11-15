import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native'
import { useApp } from '../hooks/AppContext'
import { TUTORIAL_PAGES, TutorialKind } from '../utils/tutorial'
import { SOLO_USER_ID } from '../utils/defaults'

const ACCENT: Record<TutorialKind, string> = { parent: '#4f9cf9', child: '#4fcf8e', solo: '#1e8e5a' }

/** はじめて使う人（保護者・こども・ひとりモード）に、使い方を見せる。見終えるとその人のIDを記録し、設定やホームからまた開ける */
export default function Tutorial({ kind }: { kind: TutorialKind }) {
  const { state, dispatch } = useApp()
  const user = state.currentUser
  const [page, setPage] = useState(0)
  // ひとりモードは決まったID、家族モードはログイン中の人のID
  const seenId = kind === 'solo' ? SOLO_USER_ID : (user && user.role === kind ? user.id : null)
  const visible = !!seenId && !state.tutorialSeen.includes(seenId)

  // 閉じるときのフェード中に1ページ目へ戻って見えないよう、開くときに先頭へ戻す
  useEffect(() => {
    if (visible) setPage(0)
  }, [visible])

  if (!seenId) return null
  const pages = TUTORIAL_PAGES[kind]
  const p = pages[Math.min(page, pages.length - 1)]
  const last = page >= pages.length - 1
  const accent = ACCENT[kind]
  const kid = kind === 'child'

  const finish = () => {
    dispatch({ type: 'SET_TUTORIAL_SEEN', payload: { userId: seenId, seen: true } })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.emoji}>{p.emoji}</Text>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.text}>{p.body}</Text>
          </ScrollView>

          <Text style={styles.pageNo}>{page + 1} / {pages.length}</Text>
          <View style={styles.dots}>
            {pages.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && { backgroundColor: accent, width: 18 }]} />
            ))}
          </View>

          <View style={styles.btnRow}>
            {page === 0 ? (
              <TouchableOpacity onPress={finish} style={[styles.btn, styles.skip]}>
                <Text style={styles.skipText}>{kid ? 'とばす' : 'スキップ'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setPage(page - 1)} style={[styles.btn, styles.skip]}>
                <Text style={styles.skipText}>{kid ? 'もどる' : '戻る'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => (last ? finish() : setPage(page + 1))} style={[styles.btn, { backgroundColor: accent }]}>
              <Text style={styles.nextText}>{last ? (kid ? 'はじめる！' : 'はじめる') : (kid ? 'つぎへ' : '次へ')}</Text>
            </TouchableOpacity>
          </View>
          {page > 0 && !last && (
            <TouchableOpacity onPress={finish}>
              <Text style={styles.skipLink}>{kid ? 'さいごまでとばす' : '説明をとじる'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, maxHeight: '85%', gap: 14 },
  body: { alignItems: 'center', gap: 12, paddingVertical: 4 },
  emoji: { fontSize: 56 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a202c', textAlign: 'center' },
  text: { fontSize: 15, color: '#475569', lineHeight: 24 },
  pageNo: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  skip: { backgroundColor: '#f1f5f9' },
  skipText: { color: '#64748b', fontWeight: '700' },
  nextText: { color: 'white', fontWeight: '700', fontSize: 15 },
  skipLink: { fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 4 },
})
