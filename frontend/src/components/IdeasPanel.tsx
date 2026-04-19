import { type CSSProperties, FormEvent, useCallback, useEffect, useState } from 'react';
import { apiJson } from '../lib/api-client';

type Idea = {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
};

export function IdeasPanel() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<Idea[]>('/ideas');
      setIdeas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ideas');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      return;
    }
    setError(null);
    try {
      await apiJson('/ideas', { method: 'POST', body: JSON.stringify({ body: body.trim() }) });
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed');
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await apiJson(`/ideas/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <section style={sectionStyle}>
      <h2>Ideas</h2>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      <form onSubmit={add} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Capture an idea…"
          rows={3}
          style={{ width: '100%', padding: '0.45rem' }}
        />
        <button type="submit">Save idea</button>
      </form>
      {ideas.length === 0 ? (
        <p style={{ color: '#666' }}>No ideas yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {ideas.map((it) => (
            <li key={it.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              {it.title ? <strong>{it.title}</strong> : null}
              <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{it.body}</p>
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
