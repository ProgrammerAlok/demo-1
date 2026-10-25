export const API = 'http://localhost:3001'
export const PASSWORD = 'secret123'

let counter = 0

export function uniqueEmail(prefix = 'user') {
  counter += 1
  return `${prefix}-${process.pid}-${Date.now()}-${counter}@example.com`
}

export async function register(request, { email = uniqueEmail(), password = PASSWORD } = {}) {
  const res = await request.post(`${API}/api/signup`, { data: { email, password } })
  return { email, password, res }
}
