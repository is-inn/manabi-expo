import { Tabs, Redirect } from 'expo-router'
import { Text } from 'react-native'
import { useApp } from '../../src/hooks/AppContext'

export default function SoloLayout() {
  const { state } = useApp()
  // ひとりモードでないときは入口に戻す（使い方を切り替えた直後など）
  if (state.mode !== 'solo') return <Redirect href="/" />

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: 'white', borderTopColor: '#e2e8f0' },
      tabBarActiveTintColor: '#1e8e5a',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="home" options={{ title: 'ホーム', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
      <Tabs.Screen name="timer" options={{ title: 'けいそく', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⏱️</Text> }} />
      <Tabs.Screen name="log" options={{ title: 'きろく', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📝</Text> }} />
      <Tabs.Screen name="settings" options={{ title: '設定', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }} />
    </Tabs>
  )
}
