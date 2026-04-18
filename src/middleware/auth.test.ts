import { describe, it, expect, vi } from 'vitest'
import { withAuth, authOptionsFromEnv } from './auth'
import type { Env } from '../config/env'

const makeEnv = (apiKey = 'secret'): Env => ({ API_KEY: apiKey } as Env)

const makeRequest = (token?: string, header: 'Authorization' | 'X-API-Key' = 'Authorization') => {
  const headers: Record<string, string> = {}
  if (token) {
    headers[header] = header === 'Authorization' ? `Bearer ${token}` : token
  }
  return new Request('https://example.com/', { headers })
}

describe('authOptionsFromEnv', () => {
  it('reads API_KEY from env', () => {
    expect(authOptionsFromEnv(makeEnv('mykey'))).toEqual({ apiKey: 'mykey' })
  })
})

describe('withAuth', () => {
  const inner = vi.fn(async () => new Response('ok', { status: 200 }))

  it('passes through when no apiKey configured', async () => {
    const handler = withAuth(inner, { apiKey: '' })
    const res = await handler(makeRequest(), makeEnv(''))
    expect(res.status).toBe(200)
  })

  it('returns 401 when token missing', async () => {
    const handler = withAuth(inner, { apiKey: 'secret' })
    const res = await handler(makeRequest(), makeEnv())
    expect(res.status).toBe(401)
  })

  it('returns 401 when token wrong', async () => {
    const handler = withAuth(inner, { apiKey: 'secret' })
    const res = await handler(makeRequest('wrong'), makeEnv())
    expect(res.status).toBe(401)
  })

  it('passes through with correct Bearer token', async () => {
    inner.mockClear()
    const handler = withAuth(inner, { apiKey: 'secret' })
    const res = await handler(makeRequest('secret'), makeEnv())
    expect(res.status).toBe(200)
    expect(inner).toHaveBeenCalledOnce()
  })

  it('passes through with correct X-API-Key header', async () => {
    inner.mockClear()
    const handler = withAuth(inner, { apiKey: 'secret' })
    const res = await handler(makeRequest('secret', 'X-API-Key'), makeEnv())
    expect(res.status).toBe(200)
  })
})
