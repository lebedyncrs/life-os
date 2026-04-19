import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { apiJson } from '../lib/api-client';

type Summary = {
  week_start: string;
  training_count: number;
};

export function HabitsPanel() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiJson<Summary>('/habits/summary');
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load habits');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function logToday() {
    setMsg(null);
    setError(null);
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      await apiJson('/habits/training-sessions', {
        method: 'POST',
        body: JSON.stringify({ occurred_on: today }),
      });
      setMsg('Logged training for today.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Log failed');
    }
  }

  return (
    <section style={sectionStyle}>
      <h2>Habits</h2>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {msg ? <p style={{ color: '#065f46' }}>{msg}</p> : null}
      {summary ? (
        <p>
          This week (from {summary.week_start}): <strong>{summary.training_count}</strong> training day(s).
        </p>
      ) : (
        <p style={{ color: '#666' }}>Loading summary…</p>
      )}
      <button type="button" onClick={() => void logToday()}>
        Log training today
      </button>
    </section>
  );
}

const sectionStyle: CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '1rem',
  background: '#fafafa',
};
