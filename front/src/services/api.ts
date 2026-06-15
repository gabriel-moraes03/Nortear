import type { LoginData, RegisterData, AuthResponse, User, BackendMessage, ChatSession, Vaga } from '../types'

const BASE = '/api'

function getToken() {
  return localStorage.getItem('nortear_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    let message = `Erro ${res.status}`
    if (body) {
      try {
        const parsed = JSON.parse(body)
        message = parsed.detail || parsed.message || parsed.error || body
      } catch {
        message = body
      }
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const authApi = {
  login: (data: LoginData) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse<AuthResponse>(r)),

  register: (data: RegisterData) =>
    fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => handleResponse<void>(r)),
}

export const userApi = {
  me: () =>
    fetch(`${BASE}/users/me`, { headers: authHeaders() }).then(r => handleResponse<User>(r)),

  update: (data: { name: string }) =>
    fetch(`${BASE}/users/me`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(r => handleResponse<User>(r)),

  replaceSkills: (names: string[]) =>
    fetch(`${BASE}/users/me/skills`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ names }),
    }).then(r => handleResponse<{ id: number; name: string }[]>(r)),

  addSkill: (name: string) =>
    fetch(`${BASE}/users/me/skills`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    }).then(r => handleResponse<{ id: number; name: string }>(r)),

  removeSkillByName: (name: string) =>
    fetch(`${BASE}/users/me/skills/byname/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(r => handleResponse<void>(r)),
}

export const chatApi = {
  createSession: () =>
    fetch(`${BASE}/v1/chats`, {
      method: 'POST',
      headers: authHeaders(),
    }).then(r => handleResponse<ChatSession>(r)),

  getHistory: (sessionId: string) =>
    fetch(`${BASE}/v1/chats/${sessionId}/history`, {
      headers: authHeaders(),
    }).then(r => handleResponse<BackendMessage[]>(r)),

  sendMessage: (sessionId: string, content: string) =>
    fetch(`${BASE}/v1/chats/${sessionId}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    }).then(r => handleResponse<BackendMessage>(r)),
}

export const vagasApi = {
  getAll: (limit = 20) =>
    fetch(`${BASE}/vagas?limit=${limit}`, {
      headers: authHeaders(),
    }).then(r => handleResponse<Vaga[]>(r)),
}

export const telegramApi = {
  link: (code: string) =>
    fetch(`${BASE}/v1/telegram/link`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    }).then(r => handleResponse<{ telegramChatId: string }>(r)),

  status: () =>
    fetch(`${BASE}/v1/telegram/status`, {
      headers: authHeaders(),
    }).then(r => handleResponse<{ linked: boolean; telegramChatId?: string }>(r)),
}
