import { type ReactElement, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { apiJson } from '../lib/api-client';
import { DashboardHomePage } from '../pages/DashboardHomePage';
import { LoginPage } from '../pages/LoginPage';

type Me = { id: string; email: string };

function RequireAuth({ children }: { children: ReactElement }) {
  const [state, setState] = useState<'loading' | 'in' | 'out'>('loading');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await apiJson<Me>('/me');
        if (!cancelled) {
          setState('in');
        }
      } catch {
        if (!cancelled) {
          setState('out');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return <p style={{ fontFamily: 'system-ui', padding: '2rem' }}>Loading…</p>;
  }
  if (state === 'out') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardHomePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
