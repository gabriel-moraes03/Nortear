export interface User {
  id: string
  name: string
  email: string
  skills: string[]
  goals: string[]
  telegramChatId?: string
  status: 'ACTIVE' | 'PENDING_CONFIRMATION' | 'REGISTRATION_FAILED'
}

// Formato que vem do backend (chat-service)
export interface BackendMessage {
  id: number
  sessionId: string
  sender: 'USER' | 'AI'
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  userId: number
  createdAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  vagasSugeridas?: Vaga[]
}

export interface Vaga {
  id: string
  titulo: string
  empresa: string
  localizacao: string
  modalidade: string
  nivel: string
  skills: string[]
  descricao: string
  url: string
  matchScore: number
  postedAt?: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  vagaDesejada: string
  skillsAtuais: string[]
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
