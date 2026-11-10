import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import Tutorial from '../../src/components/Tutorial'

export default function ParentLayout() {
  return (
    <>
    <Tutorial role="parent" />
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: 'white', borderTopColor: '#e2e8f0' },
      tabBarActiveTintColor: '#4f9cf9',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="home" options={{ title: 'ホーム', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
      <Tabs.Screen name="self" options={{ title: 'じぶん', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⏱️</Text> }} />
      <Tabs.Screen name="tasks" options={{ title: 'タスク', tabBarIcon: () => <Text style={{ fontSize: 20 }}>✅</Text> }} />
      <Tabs.Screen name="progress" options={{ title: '進捗', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }} />
      <Tabs.Screen name="settings" options={{ title: '設定', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }} />
    </Tabs>
    </>
  )
}
