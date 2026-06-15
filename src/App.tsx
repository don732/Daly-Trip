import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TripProvider } from '@/context/TripContext'
import { StyleInjector } from '@/components/StyleInjector'
import { InstallPrompt } from '@/components/InstallPrompt'
import { WelcomeFlow } from '@/flows/WelcomeFlow'
import { JoinFlow } from '@/flows/JoinFlow'
import { TripBuilderFlow } from '@/flows/TripBuilderFlow'
import { MainApp, resolveInitialRoute } from '@/MainApp'

export function App() {
  return (
    <TripProvider>
      <StyleInjector />
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeFlow />} />
          <Route path="/plan" element={<TripBuilderFlow />} />
          <Route path="/join" element={<JoinFlow />} />
          <Route path="/trip/:tripId" element={<MainApp />} />
          <Route path="*" element={<Navigate to={resolveInitialRoute()} replace />} />
        </Routes>
      </BrowserRouter>
    </TripProvider>
  )
}
