import { Stack } from 'expo-router'
import { AppProvider } from '../src/hooks/AppContext'

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  )
}
