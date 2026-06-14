import { useState, useRef, useEffect, FormEvent } from 'react'
import { Send, Sparkles, User, Briefcase, MapPin, Loader2 } from 'lucide-react'
import type { Message, Vaga, BackendMessage } from '../types'
import { chatApi } from '../services/api'

function backendToMessage(m: BackendMessage): Message {
  return {
    id: String(m.id),
    role: m.sender === 'USER' ? 'user' : 'assistant',
    content: m.content,
    timestamp: m.timestamp,
  }
}

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content: 'Olá! Sou o Nortear, alimentado por IA local via Ollama + RAG. Posso analisar seu perfil, sugerir vagas e traçar um roadmap de carreira. Como posso ajudá-lo hoje?',
  timestamp: new Date().toISOString(),
}

function VagaCard({ vaga }: { vaga: Vaga }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 mt-2 text-xs">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <p className="font-semibold text-slate-100 text-sm">{vaga.titulo}</p>
          <p className="text-slate-400">{vaga.empresa}</p>
        </div>
        <span className="text-green-400 font-bold whitespace-nowrap">{vaga.matchScore}%</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-500 mb-2">
        <MapPin size={10} /> {vaga.localizacao || 'Não informado'}
      </div>
      <div className="flex flex-wrap gap-1">
        {vaga.skills.map(s => (
          <span key={s} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function ChatMessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
          isUser ? 'bg-indigo-600' : 'bg-purple-700/60'
        }`}
      >
        {isUser ? <User size={13} /> : <Sparkles size={13} />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/60'
          }`}
        >
          {msg.content}
        </div>
        {msg.vagasSugeridas && msg.vagasSugeridas.length > 0 && (
          <div className="w-full mt-1">
            <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
              <Briefcase size={9} /> Vagas encontradas via RAG
            </p>
            {msg.vagasSugeridas.map(v => (
              <VagaCard key={v.id} vaga={v} />
            ))}
          </div>
        )}
        <span className="text-[10px] text-slate-600 mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Cria sessão e carrega histórico ao montar
  useEffect(() => {
    async function init() {
      try {
        const session = await chatApi.createSession()
        setSessionId(session.id)
        const history = await chatApi.getHistory(session.id)
        if (history.length > 0) {
          setMessages([WELCOME, ...history.map(backendToMessage)])
        }
      } catch (e) {
        console.error('Falha ao inicializar sessão de chat:', e)
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || loading || !sessionId) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await chatApi.sendMessage(sessionId, content)
      setMessages(prev => [...prev, backendToMessage(response)])
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-3 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-lg bg-purple-700/40 flex items-center justify-center">
          <Sparkles size={16} className="text-purple-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Assistente Nortear</p>
          <p className="text-xs text-slate-500">Ollama (LLM Local) · RAG ativo</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${initializing ? 'bg-yellow-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span className={`text-xs ${initializing ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {initializing ? 'Conectando...' : 'Online'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map(msg => (
          <ChatMessageBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-purple-700/60 flex items-center justify-center">
              <Sparkles size={13} />
            </div>
            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={14} className="text-slate-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-slate-800 p-4 bg-slate-900/50 backdrop-blur-sm"
      >
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={initializing ? 'Conectando ao assistente...' : 'Pergunte sobre vagas, roadmaps, skills...'}
            disabled={initializing}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || initializing}
            className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-all shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">
          Modelo local · Dados não saem do servidor · MCP + RAG ativo
        </p>
      </form>
    </div>
  )
}
