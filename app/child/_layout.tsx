import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import Tutorial from '../../src/components/Tutorial'

export default function ChildLayout() {
  return (
    <>
    <Tutorial kind="child" />
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: 'white', borderTopColor: '#e2e8f0' },
      tabBarActiveTintColor: '#4f9cf9',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="home" options={{ title: 'ホーム', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
      <Tabs.Screen name="timer" options={{ title: 'タイマー', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⏱️</Text> }} />
      <Tabs.Screen name="tasks" options={{ title: 'タスク', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📝</Text> }} />
      <Tabs.Screen name="family" options={{ title: 'おうちの人', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👪</Text> }} />
    </Tabs>
    </>
  )
}
