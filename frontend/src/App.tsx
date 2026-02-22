import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/Loginpage';
import RegisterPage from '@/pages/Registerpage';
import LibraryPage from '@/pages/LibraryPage';
import ImportPage from '@/pages/ImportPage';
import ExplorePage from '@/pages/Explorepage';
import StatsPage from '@/pages/Statspage';
import { queryClient } from '@/lib/queryClient';

const Guard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <>{children}</>;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index element={<Navigate to="/library" replace />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0f0f18',
            color: '#e8e8f0',
            border: '1px solid #1e1e2e',
          },
        }}
      />
    </QueryClientProvider>
  );
}