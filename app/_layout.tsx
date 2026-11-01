import { Stack } from 'expo-router'
import { AppProvider } from '../src/hooks/AppContext'
import { AccountProvider } from '../src/hooks/AccountContext'

export default function RootLayout() {
  return (
    <AppProvider>
      <AccountProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AccountProvider>
    </AppProvider>
  )
}
