import { useState, FormEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Mail, Lock, User, Briefcase, Code, X, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Step = 1 | 2 | 3

const STEP_LABELS = ['Dados de Acesso', 'Meta de Carreira', 'Skills Atuais']

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s < current
                ? 'bg-indigo-600 text-white'
                : s === current
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {s < current ? <Check size={12} /> : s}
          </div>
          {i < 2 && <div className={`w-10 h-px ${s < current ? 'bg-indigo-600' : 'bg-slate-800'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [vagaDesejada, setVagaDesejada] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  function addSkill(value: string) {
    const trimmed = value.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed])
    }
    setSkillInput('')
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    }
  }

  function removeSkill(s: string) {
    setSkills(prev => prev.filter(x => x !== s))
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      if (!name || !email || !password) return setError('Preencha todos os campos.')
      if (password !== confirm) return setError('As senhas não coincidem.')
      if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    }
    if (step === 2 && !vagaDesejada) return setError('Informe a vaga desejada.')
    setStep(s => (s + 1) as Step)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (skills.length === 0) return setError('Adicione pelo menos uma skill.')
    setLoading(true)
    setError('')
    try {
      await register({ name, email, password, vagaDesejada, skillsAtuais: skills })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-3 shadow-lg shadow-indigo-500/20">
              <Compass size={22} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nortear
            </h1>
            <p className="text-sm text-slate-400 mt-1">Crie sua conta e trace sua rota</p>
          </div>

          <StepIndicator current={step} />

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">
              Etapa {step}/3 — {STEP_LABELS[step - 1]}
            </h2>

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome Completo</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <User size={13} />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <Mail size={13} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="dev@exemplo.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock size={13} />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirmar Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock size={13} />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Qual vaga você está buscando?
                </label>
                <p className="text-xs text-slate-500">Seja específico. Ex: Desenvolvedor Frontend React Júnior</p>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Briefcase size={15} />
                  </span>
                  <input
                    type="text"
                    value={vagaDesejada}
                    onChange={e => setVagaDesejada(e.target.value)}
                    placeholder="Ex: Desenvolvedor Node.js Pleno"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
                  <span className="text-purple-400 font-medium">Dica:</span> Essa informação alimenta o motor de RAG para encontrar vagas alinhadas ao seu objetivo e personalizar os roadmaps da IA.
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Quais tecnologias/skills você já domina?
                </label>
                <p className="text-xs text-slate-500">Digite e pressione Enter ou vírgula para adicionar.</p>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Code size={15} />
                  </span>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => addSkill(skillInput)}
                    placeholder="Ex: React, TypeScript, Git..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSkill(s)}
                          className="text-indigo-400 hover:text-white"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => (s - 1) as Step)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-all"
              >
                <ArrowLeft size={14} />
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={nextStep}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-purple-600/10"
              >
                Próximo <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit as unknown as () => void}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Criar Minha Conta
              </button>
            )}
          </div>

          <div className="border-t border-slate-800/60 mt-6 pt-5 text-center">
            <p className="text-sm text-slate-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
