import { Stack } from 'expo-router'
import { AppProvider } from '../src/hooks/AppContext'
import { AccountProvider } from '../src/hooks/AccountContext'
import TimerLiveActivity from '../src/components/TimerLiveActivity'

export default function RootLayout() {
  return (
    <AppProvider>
      <AccountProvider>
        <TimerLiveActivity />
        <Stack screenOptions={{ headerShown: false }} />
      </AccountProvider>
    </AppProvider>
  )
}
