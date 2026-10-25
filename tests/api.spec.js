import { expect, test } from '@playwright/test'
import { API, PASSWORD, register, uniqueEmail } from './helpers.js'

test.describe('health', () => {
  test('reports ok', async ({ request }) => {
    const res = await request.get(`${API}/api/health`)

    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

test.describe('POST /api/signup', () => {
  test('creates a user and returns a token', async ({ request }) => {
    const email = uniqueEmail()
    const res = await request.post(`${API}/api/signup`, {
      data: { email, password: PASSWORD },
    })

    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.user).toEqual({ email })
    expect(body.token).toMatch(/^[a-f0-9]{48}$/)
  })

  test('rejects missing fields with 400', async ({ request }) => {
    const res = await request.post(`${API}/api/signup`, { data: {} })

    expect(res.status()).toBe(400)
    expect((await res.json()).error).toBe('Email and password are required')
  })

  test('rejects an invalid email with 400', async ({ request }) => {
    const res = await request.post(`${API}/api/signup`, {
      data: { email: 'not-an-email', password: PASSWORD },
    })

    expect(res.status()).toBe(400)
    expect((await res.json()).error).toBe('Invalid email')
  })

  test('rejects a short password with 400', async ({ request }) => {
    const res = await request.post(`${API}/api/signup`, {
      data: { email: uniqueEmail(), password: '123' },
    })

    expect(res.status()).toBe(400)
    expect((await res.json()).error).toBe('Password must be at least 6 characters')
  })

  test('rejects a duplicate email with 409', async ({ request }) => {
    const { email } = await register(request)

    const res = await request.post(`${API}/api/signup`, {
      data: { email, password: PASSWORD },
    })

    expect(res.status()).toBe(409)
    expect((await res.json()).error).toBe('Email already registered')
  })
})

test.describe('POST /api/signin', () => {
  test('returns a token for valid credentials', async ({ request }) => {
    const { email, password } = await register(request)

    const res = await request.post(`${API}/api/signin`, { data: { email, password } })

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.user).toEqual({ email })
    expect(body.token).toMatch(/^[a-f0-9]{48}$/)
  })

  test('rejects a wrong password with 401', async ({ request }) => {
    const { email } = await register(request)

    const res = await request.post(`${API}/api/signin`, {
      data: { email, password: 'wrong-password' },
    })

    expect(res.status()).toBe(401)
    expect((await res.json()).error).toBe('Invalid email or password')
  })

  test('rejects an unknown email with 401', async ({ request }) => {
    const res = await request.post(`${API}/api/signin`, {
      data: { email: uniqueEmail('nobody'), password: PASSWORD },
    })

    expect(res.status()).toBe(401)
  })
})

test.describe('GET /api/me', () => {
  test('returns the signed-in user for a valid token', async ({ request }) => {
    const { res: signup } = await register(request)
    const { token, user } = await signup.json()

    const res = await request.get(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ user })
  })

  test('returns 401 without a token', async ({ request }) => {
    const res = await request.get(`${API}/api/me`)

    expect(res.status()).toBe(401)
    expect((await res.json()).error).toBe('Not authenticated')
  })

  test('returns 401 for an invalid token', async ({ request }) => {
    const res = await request.get(`${API}/api/me`, {
      headers: { Authorization: 'Bearer not-a-real-token' },
    })

    expect(res.status()).toBe(401)
  })
})

test.describe('POST /api/signout', () => {
  test('invalidates the token', async ({ request }) => {
    const { res: signup } = await register(request)
    const { token } = await signup.json()
    const auth = { headers: { Authorization: `Bearer ${token}` } }

    const signout = await request.post(`${API}/api/signout`, auth)
    expect(signout.status()).toBe(204)

    const me = await request.get(`${API}/api/me`, auth)
    expect(me.status()).toBe(401)
  })
})
