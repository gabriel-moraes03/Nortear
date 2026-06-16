import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Code2,
  Target,
  MessageSquare,
  TrendingUp,
  MapPin,
  Bell,
  Sparkles,
  ArrowRight,
  Activity,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { vagasApi } from '../services/api'
import type { Vaga } from '../types'

function MatchBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-400 bg-green-400/10' : score >= 80 ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-400 bg-slate-700/50'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}% match
    </span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] ?? 'Usuário'

  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loadingVagas, setLoadingVagas] = useState(true)

  useEffect(() => {
    vagasApi.getAll(10)
      .then(setVagas)
      .catch(() => setVagas([]))
      .finally(() => setLoadingVagas(false))
  }, [])

  const topVagas = vagas.slice(0, 3)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">
          Olá, {firstName} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Aqui está um resumo da sua jornada de carreira.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Briefcase size={18} className="text-indigo-400" />}
          label="Vagas Compatíveis"
          value={loadingVagas ? '…' : String(vagas.length)}
          sub="no seu perfil"
          accent="indigo"
        />
        <StatCard
          icon={<Code2 size={18} className="text-purple-400" />}
          label="Skills no Perfil"
          value={String(user?.skills?.length ?? 0)}
          sub="mapeadas"
          accent="purple"
        />
        <StatCard
          icon={<Activity size={18} className="text-emerald-400" />}
          label="Status da Conta"
          value={user?.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
          sub={user?.status === 'ACTIVE' ? 'perfil completo' : 'aguardando IA'}
          accent="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <TrendingUp size={15} className="text-indigo-400" />
              Vagas compatíveis hoje
            </h2>
            <button
              onClick={() => navigate('/vagas')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowRight size={11} />
            </button>
          </div>

          {loadingVagas && (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}

          {!loadingVagas && topVagas.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
              <Briefcase size={24} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-500">
                Nenhuma vaga compatível ainda. Verifique se seu perfil foi processado pela IA.
              </p>
            </div>
          )}

          {!loadingVagas && topVagas.map(v => (
            <div
              key={v.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{v.titulo}</p>
                  <p className="text-xs text-slate-500">{v.empresa}</p>
                </div>
                <MatchBadge score={v.matchScore} />
              </div>
              {v.localizacao && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <MapPin size={11} /> {v.localizacao}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {v.skills.slice(0, 6).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div
            onClick={() => navigate('/chat')}
            className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-5 cursor-pointer hover:border-indigo-400/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/30 flex items-center justify-center">
                <Sparkles size={17} className="text-indigo-300" />
              </div>
              <p className="text-sm font-semibold text-slate-100">Assistente IA</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Converse com o modelo local (Ollama + RAG) para analisar seu perfil, revisar vagas e traçar seu roadmap.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors">
              <MessageSquare size={13} />
              Iniciar conversa
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={15} className="text-purple-400" />
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Metas</p>
            </div>
            {user?.goals?.length ? (
              <ul className="space-y-2">
                {user.goals.map((g, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">›</span> {g}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600 italic">Nenhuma meta cadastrada ainda.</p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Telegram</p>
            </div>
            {user?.telegramChatId ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-xs text-emerald-400">Conectado</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">Receba alertas de vagas no Telegram.</p>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Conectar agora →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: 'indigo' | 'purple' | 'emerald'
}) {
  const ring = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
  }[accent]

  return (
    <div className={`bg-slate-900 border ${ring} rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}
