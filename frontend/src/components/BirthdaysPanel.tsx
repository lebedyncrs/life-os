import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { apiJson } from '../lib/api-client';

type Birthday = {
  id: string;
  person_name: string;
  next_occurrence_on: string;
  lead_days: number;
};

export function BirthdaysPanel() {
  const [rows, setRows] = useState<Birthday[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<Birthday[]>('/birthdays');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load birthdays');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section style={sectionStyle}>
      <h2>Upcoming birthdays</h2>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {rows.length === 0 ? (
        <p style={{ color: '#666' }}>No birthday reminders yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
              <strong>{r.person_name}</strong> — {r.next_occurrence_on} (remind {r.lead_days}d before)
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
