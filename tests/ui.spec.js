import { expect, test } from '@playwright/test'
import { PASSWORD, register, uniqueEmail } from './helpers.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('shows the sign-in form by default', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('signs up and lands on the dashboard', async ({ page }) => {
  const email = uniqueEmail('ui')

  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
})

test('shows the server error when the email is already registered', async ({ page, request }) => {
  const { email } = await register(request)

  await page.getByRole('button', { name: 'Sign up' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('alert')).toHaveText('Email already registered')
})

test('shows the server error for a short password', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign up' }).click()
  await page.getByLabel('Email').fill(uniqueEmail('ui'))
  await page.getByLabel('Password').fill('123')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('alert')).toHaveText('Password must be at least 6 characters')
})

test('signs in with an account created through the API', async ({ page, request }) => {
  const { email, password } = await register(request)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
})

test('shows the server error for a wrong password', async ({ page, request }) => {
  const { email } = await register(request)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('alert')).toHaveText('Invalid email or password')
})

test('signs out and forgets the token', async ({ page }) => {
  const email = uniqueEmail('ui')

  await page.getByRole('button', { name: 'Sign up' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('demo.token'))).toBeNull()
})
