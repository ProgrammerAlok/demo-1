import { useEffect, useState } from 'react'
import * as api from './api'

export default function App() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('signin')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(Boolean(api.getToken()))

  useEffect(() => {
    if (!api.getToken()) return
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => api.setToken(null))
      .finally(() => setChecking(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    const password = form.get('password')

    setBusy(true)
    setError('')
    try {
      const result = mode === 'signup' ? await api.signup(email, password) : await api.signin(email, password)
      api.setToken(result.token)
      setUser(result.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    await api.signout().catch(() => {})
    api.setToken(null)
    setUser(null)
    setMode('signin')
    setError('')
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
  }

  if (checking) {
    return (
      <main className="card">
        <p>Loading…</p>
      </main>
    )
  }

  if (user) {
    return (
      <main className="card">
        <h1>Dashboard</h1>
        <p>
          Signed in as <strong>{user.email}</strong>
        </p>
        <button onClick={handleSignOut}>Sign out</button>
      </main>
    )
  }

  const isSignup = mode === 'signup'

  return (
    <main className="card">
      <h1>{isSignup ? 'Create account' : 'Sign in'}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
        />

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy}>
          {isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p>
        {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
        <button type="button" className="link" onClick={switchMode}>
          {isSignup ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </main>
  )
}
