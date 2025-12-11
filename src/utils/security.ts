import crypto from 'crypto'

const PBKDF2_ITERATIONS = 100000
const PBKDF2_KEY_LEN = 64
const PBKDF2_DIGEST = 'sha256'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5

const rateLimitStore = new Map<string, number[]>()
const csrfStore = new Map<string, number>()

export type VerificationCodeType = 'signup' | 'login' | 'password_reset'

export function hashPasswordPBKDF2(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, PBKDF2_DIGEST)
    .toString('hex')
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derivedKey}`
}

export function isPBKDF2Hash(value: string): boolean {
  return value?.startsWith('pbkdf2$')
}

export function verifyPBKDF2(password: string, stored: string): boolean {
  try {
    const [, iterationsStr, salt, hash] = stored.split('$')
    const iterations = parseInt(iterationsStr, 10)
    const derivedKey = crypto
      .pbkdf2Sync(password, salt, iterations || PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, PBKDF2_DIGEST)
      .toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(derivedKey))
  } catch {
    return false
  }
}

export function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, '').slice(0, 255)
}

export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email) && email.length <= 254
}

export function validatePasswordStrength(password: string) {
  const errors: string[] = []
  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must include an uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must include a lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must include a number')
  if (!/[!@#$%^&*]/.test(password)) errors.push('Password must include a special character')
  return { valid: errors.length === 0, errors }
}

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export function isRateLimited(identifier: string, limit = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_WINDOW): boolean {
  const now = Date.now()
  const existing = rateLimitStore.get(identifier) || []
  const recent = existing.filter((timestamp) => now - timestamp < windowMs)
  if (recent.length >= limit) {
    rateLimitStore.set(identifier, recent)
    return true
  }
  recent.push(now)
  rateLimitStore.set(identifier, recent)
  return false
}

export function issueCsrfToken(): string {
  const token = crypto.randomBytes(32).toString('hex')
  csrfStore.set(token, Date.now())
  return token
}

export function validateCsrfToken(token?: string | null): boolean {
  if (!token) return false
  const createdAt = csrfStore.get(token)
  if (!createdAt) return false
  if (Date.now() - createdAt > 60 * 60 * 1000) {
    csrfStore.delete(token)
    return false
  }
  return true
}
