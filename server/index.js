import express from 'express'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const app = express()
app.use(express.json())

// ponytail: in-memory stores, swap for a database when data must survive a restart
const users = new Map()
const sessions = new Map()

const hashPassword = (password, salt) => scryptSync(password, salt, 64)

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const email = token && sessions.get(token)
  if (!email) return res.status(401).json({ error: 'Not authenticated' })
  req.user = { email }
  req.token = token
  next()
}

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.post('/api/signup', (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const key = email.toLowerCase()
  if (users.has(key)) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const salt = randomBytes(16).toString('hex')
  users.set(key, { email: key, salt, passwordHash: hashPassword(password, salt).toString('hex') })

  const token = randomBytes(24).toString('hex')
  sessions.set(token, key)
  res.status(201).json({ token, user: { email: key } })
})

app.post('/api/signin', (req, res) => {
  const { email, password } = req.body ?? {}
  const user = users.get(String(email ?? '').toLowerCase())
  if (!user || !password) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const expected = Buffer.from(user.passwordHash, 'hex')
  const actual = hashPassword(password, user.salt)
  if (!timingSafeEqual(expected, actual)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = randomBytes(24).toString('hex')
  sessions.set(token, user.email)
  res.json({ token, user: { email: user.email } })
})

app.get('/api/me', authenticate, (req, res) => res.json({ user: req.user }))

app.post('/api/signout', authenticate, (req, res) => {
  sessions.delete(req.token)
  res.status(204).end()
})

const PORT = 3001
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
