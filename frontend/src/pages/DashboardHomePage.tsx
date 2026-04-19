import { useNavigate } from 'react-router-dom';
import { BirthdaysPanel } from '../components/BirthdaysPanel';
import { HabitsPanel } from '../components/HabitsPanel';
import { IdeasPanel } from '../components/IdeasPanel';
import { ShoppingListPanel } from '../components/ShoppingListPanel';
import { apiJson } from '../lib/api-client';

export function DashboardHomePage() {
  const navigate = useNavigate();

  async function logout() {
    await apiJson('/auth/logout', { method: 'POST' });
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 960, margin: '0 auto', padding: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Life OS</h1>
        <button type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </header>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <ShoppingListPanel />
        <IdeasPanel />
        <BirthdaysPanel />
        <HabitsPanel />
      </div>
    </div>
  );
}
