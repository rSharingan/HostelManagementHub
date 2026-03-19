// path: src/app/providers.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '../features/auth/AuthProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
})

export const Providers = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster
          position="top-right"
          theme="system"
          richColors
          expand={true}
        />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
