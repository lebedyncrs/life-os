import { type CSSProperties, FormEvent, useCallback, useEffect, useState } from 'react';
import { apiJson } from '../lib/api-client';

type Item = {
  id: string;
  title: string;
  is_done: boolean;
  source: string;
  created_at: string;
};

export function ShoppingListPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<Item[]>('/shopping-items');
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load shopping');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }
    setError(null);
    try {
      await apiJson('/shopping-items', { method: 'POST', body: JSON.stringify({ title: title.trim() }) });
      setTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed');
    }
  }

  async function toggle(item: Item) {
    setError(null);
    try {
      await apiJson(`/shopping-items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_done: !item.is_done }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await apiJson(`/shopping-items/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <section style={sectionStyle}>
      <h2>Shopping</h2>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      <form onSubmit={add} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add item…"
          style={{ flex: 1, padding: '0.45rem' }}
        />
        <button type="submit">Add</button>
      </form>
      {items.length === 0 ? (
        <p style={{ color: '#666' }}>No items yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <input type="checkbox" checked={it.is_done} onChange={() => void toggle(it)} />
              <span style={{ textDecoration: it.is_done ? 'line-through' : 'none', flex: 1 }}>{it.title}</span>
              <button type="button" onClick={() => void remove(it.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const sectionStyle: CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '1rem',
  background: '#fafafa',
};
