import { useState, FormEvent, KeyboardEvent, useEffect } from 'react'
import { User, Code, Target, Bell, Plus, X, Save, Check, Loader2, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userApi, telegramApi } from '../services/api'

type Tab = 'dados' | 'skills' | 'metas' | 'telegram'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dados', label: 'Dados Pessoais', icon: <User size={14} /> },
  { id: 'skills', label: 'Skills', icon: <Code size={14} /> },
  { id: 'metas', label: 'Metas', icon: <Target size={14} /> },
  { id: 'telegram', label: 'Telegram', icon: <Bell size={14} /> },
]

export default function Profile() {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState<Tab>('dados')
  const [name, setName] = useState(user?.name ?? '')
  const [email] = useState(user?.email ?? '')
  const [skills, setSkills] = useState<string[]>(user?.skills ?? [])
  const [skillInput, setSkillInput] = useState('')
  const [goals, setGoals] = useState<string[]>(user?.goals ?? [])
  const [goalInput, setGoalInput] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Telegram state
  const [telegramCode, setTelegramCode] = useState('')
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [telegramChatId, setTelegramChatId] = useState<string | undefined>(user?.telegramChatId)
  const [telegramError, setTelegramError] = useState<string | null>(null)

  // Verifica status do Telegram ao abrir a aba
  useEffect(() => {
    if (tab === 'telegram' && !telegramChatId) {
      telegramApi.status()
        .then(s => { if (s.linked && s.telegramChatId) setTelegramChatId(s.telegramChatId) })
        .catch(() => {})
    }
  }, [tab])

  function addSkill(value: string) {
    const t = value.trim()
    if (t && !skills.includes(t)) setSkills(p => [...p, t])
    setSkillInput('')
  }

  function removeSkill(s: string) {
    setSkills(p => p.filter(x => x !== s))
  }

  function onSkillKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    }
  }

  function addGoal(value: string) {
    const t = value.trim()
    if (t && !goals.includes(t)) setGoals(p => [...p, t])
    setGoalInput('')
  }

  function removeGoal(g: string) {
    setGoals(p => p.filter(x => x !== g))
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let updatedUser = user!

      if (tab === 'dados') {
        updatedUser = await userApi.update({ name })
      } else if (tab === 'skills') {
        await userApi.replaceSkills(skills)
        updatedUser = { ...user!, skills }
      } else if (tab === 'metas') {
        // Goals: salvar localmente por enquanto (não há endpoint de replace goals)
        updatedUser = { ...user!, goals }
      }

      setUser(updatedUser)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      console.error('Erro ao salvar:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleTelegramLink() {
    if (!telegramCode.trim()) return
    setTelegramLoading(true)
    setTelegramError(null)
    try {
      const res = await telegramApi.link(telegramCode.trim())
      setTelegramChatId(res.telegramChatId)
      if (user) setUser({ ...user, telegramChatId: res.telegramChatId })
      setTelegramCode('')
    } catch (e: unknown) {
      setTelegramError(e instanceof Error ? e.message : 'Código inválido ou expirado.')
    } finally {
      setTelegramLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-600/30 border-2 border-indigo-500/40 flex items-center justify-center text-2xl font-bold text-indigo-300">
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">{user?.name}</h1>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${user?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
            {user?.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
          </span>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          {tab === 'dados' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Informações Pessoais</h2>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-600 mt-1">O e-mail não pode ser alterado.</p>
              </div>
            </div>
          )}

          {tab === 'skills' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-1">Skills & Tecnologias</h2>
              <p className="text-xs text-slate-500 mb-4">Suas skills alimentam o motor RAG para matching de vagas.</p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Plus size={13} />
                </span>
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={onSkillKey}
                  onBlur={() => addSkill(skillInput)}
                  placeholder="Adicionar skill (Enter para confirmar)..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {skills.length === 0 && (
                  <p className="text-xs text-slate-600 italic">Nenhuma skill adicionada.</p>
                )}
                {skills.map(s => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300"
                  >
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-white">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {tab === 'metas' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-1">Metas de Carreira</h2>
              <p className="text-xs text-slate-500 mb-4">Suas metas guiam o assistente de IA nas recomendações.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGoal(goalInput) } }}
                  placeholder="Ex: Conseguir vaga de Dev React Pleno em 3 meses"
                  className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => addGoal(goalInput)}
                  className="px-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="space-y-2">
                {goals.length === 0 && (
                  <p className="text-xs text-slate-600 italic">Nenhuma meta definida ainda.</p>
                )}
                {goals.map((g, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg group">
                    <span className="text-purple-400 text-xs mt-0.5 shrink-0">›</span>
                    <p className="flex-1 text-sm text-slate-300">{g}</p>
                    <button type="button" onClick={() => removeGoal(g)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'telegram' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-1">Integração Telegram</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receba alertas de vagas e converse com o assistente diretamente pelo Telegram.
              </p>
              {telegramChatId ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-400">Conectado</p>
                  </div>
                  <p className="text-xs text-slate-400">Chat ID: {telegramChatId}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 text-xs text-slate-400 space-y-2 leading-relaxed">
                    <p className="font-medium text-slate-300">Como conectar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-500">
                      <li>Abra o Telegram e busque por <span className="text-indigo-400">@NortearBot</span></li>
                      <li>Envie qualquer mensagem — o bot enviará um código</li>
                      <li>Cole o código abaixo e clique em Vincular</li>
                    </ol>
                  </div>
                  {telegramError && (
                    <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                      {telegramError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={telegramCode}
                      onChange={e => setTelegramCode(e.target.value.toUpperCase())}
                      placeholder="Ex: A1B2C3"
                      maxLength={8}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTelegramLink}
                      disabled={!telegramCode.trim() || telegramLoading}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      {telegramLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                      Vincular
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {tab !== 'telegram' && (
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-indigo-600/10"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              {saved ? 'Salvo!' : 'Salvar alterações'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
