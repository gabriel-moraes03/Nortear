import { useState, useEffect } from 'react'
import { Search, MapPin, Briefcase, SlidersHorizontal, ExternalLink, Loader2 } from 'lucide-react'
import type { Vaga } from '../types'
import { vagasApi } from '../services/api'

function MatchBadge({ score }: { score: number }) {
  const cls =
    score >= 90
      ? 'text-green-400 bg-green-400/10 border-green-500/20'
      : score >= 80
      ? 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20'
      : score >= 70
      ? 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20'
      : 'text-slate-400 bg-slate-700/50 border-slate-600/20'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {score}% match
    </span>
  )
}

function ModalidadePill({ value }: { value: string }) {
  const map: Record<string, string> = {
    Remoto: 'bg-emerald-500/10 text-emerald-400',
    Híbrido: 'bg-blue-500/10 text-blue-400',
    Presencial: 'bg-orange-500/10 text-orange-400',
  }
  const cls = map[value] ?? 'bg-slate-700/50 text-slate-400'
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {value || 'Não informado'}
    </span>
  )
}

function NivelPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    Júnior: 'bg-slate-700 text-slate-400',
    Pleno: 'bg-indigo-900/40 text-indigo-300',
    Sênior: 'bg-purple-900/40 text-purple-300',
    Especialista: 'bg-pink-900/40 text-pink-300',
    Estágio: 'bg-teal-900/40 text-teal-300',
  }
  const cls = map[value] ?? 'bg-slate-700/50 text-slate-400'
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {value || 'Não especificado'}
    </span>
  )
}

export default function Vagas() {
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [modalidade, setModalidade] = useState('Todos')
  const [nivel, setNivel] = useState('Todos')

  useEffect(() => {
    vagasApi.getAll(30)
      .then(data => setVagas(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = vagas
    .filter(v => {
      const matchQ = query === '' ||
        v.titulo.toLowerCase().includes(query.toLowerCase()) ||
        v.empresa.toLowerCase().includes(query.toLowerCase())
      const matchM = modalidade === 'Todos' || v.modalidade === modalidade
      const matchN = nivel === 'Todos' || v.nivel === nivel
      return matchQ && matchM && matchN
    })
    .sort((a, b) => b.matchScore - a.matchScore)

  const modalidades = ['Todos', 'Remoto', 'Híbrido', 'Presencial']
  const niveis = ['Todos', 'Júnior', 'Pleno', 'Sênior']

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Briefcase size={22} className="text-indigo-400" />
          Vagas
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {loading ? 'Buscando vagas compatíveis...' : `${filtered.length} vagas encontradas · ordenadas por compatibilidade via RAG`}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            <Search size={15} />
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por cargo ou empresa..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-slate-500 shrink-0" />
            <div className="flex gap-1.5">
              {modalidades.map(m => (
                <button
                  key={m}
                  onClick={() => setModalidade(m)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    modalidade === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5">
            {niveis.map(n => (
              <button
                key={n}
                onClick={() => setNivel(n)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  nivel === n ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-20 text-slate-500 gap-3">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Buscando vagas compatíveis com seu perfil via RAG...</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16 text-slate-500">
          <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Não foi possível carregar as vagas.</p>
          <p className="text-xs mt-1 text-slate-600">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {vagas.length === 0
              ? 'Nenhuma vaga indexada ainda. Execute o scraper para popular o banco.'
              : 'Nenhuma vaga encontrada com esses filtros.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(v => (
            <div
              key={v.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 text-sm leading-snug">{v.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{v.empresa}</p>
                </div>
                <MatchBadge score={v.matchScore} />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <ModalidadePill value={v.modalidade} />
                <NivelPill value={v.nivel} />
                {v.localizacao && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={10} /> {v.localizacao}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {v.skills.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-600">{v.postedAt ?? ''}</span>
                {v.url ? (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Ver vaga <ExternalLink size={11} />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
