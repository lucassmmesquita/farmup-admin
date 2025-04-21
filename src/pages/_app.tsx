// src/pages/_app.tsx
import React from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import '../styles/globals.css';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#4B9EFF', // Cor primária do FarmUP (baseado no código do APP)
    },
    secondary: {
      main: '#6C63FF', // Cor secundária do FarmUP
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Permitir acesso à página de login
  if (router.pathname === '/login') {
    return <>{children}</>;
  }
  
  // Mostra loader enquanto verifica autenticação
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Redirecionar para login se não estiver autenticado
  if (!user) {
    router.push('/login');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return <>{children}</>;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;