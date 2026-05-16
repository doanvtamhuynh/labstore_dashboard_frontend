import { QueryClientProvider } from '@tanstack/react-query'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Shell } from './layouts/Shell'
import { RequireAuth } from './layouts/RequireAuth'
import { LoginPage } from './pages/auth/LoginPage'
import { queryClient } from './queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
      </Routes>
    </QueryClientProvider>
  )
}

export default App
