import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export function AuthPage() {
  const { user, login } = useAuth();
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await login(form, register);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">TEAMFLOW / COLLABORATION</p>
        <h1>Make work visible.</h1>
        <p>Projects, decisions, and momentum—shared in one focused workspace.</p>
        <form onSubmit={submit}>
          <h2>{register ? 'Create your account' : 'Welcome back'}</h2>
          {register && (
            <label>
              Name
              <input
                required
                minLength="2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength="8"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" type="submit">
            {register ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <button className="text-button" onClick={() => setRegister(!register)}>
          {register ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </section>
    </main>
  );
}
