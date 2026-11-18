import { Stack } from 'expo-router'
import { AppProvider } from '../src/hooks/AppContext'
import { AccountProvider } from '../src/hooks/AccountContext'
import TimerLiveActivity from '../src/components/TimerLiveActivity'
import ReminderScheduler from '../src/components/ReminderScheduler'
import TimerAlertManager from '../src/components/TimerAlertManager'
import FamilySync from '../src/components/FamilySync'
import CheerManager from '../src/components/CheerManager'

export default function RootLayout() {
  return (
    <AppProvider>
      <AccountProvider>
        <TimerLiveActivity />
        <ReminderScheduler />
        <TimerAlertManager />
        <FamilySync />
        <CheerManager />
        <Stack screenOptions={{ headerShown: false }} />
      </AccountProvider>
    </AppProvider>
  )
}
