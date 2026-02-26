import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Globe, Mail, Lock, User, AtSign, ArrowRight, Loader2 } from 'lucide-react'

export default function Auth() {
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      if (!name.trim()) { setError('Name is required'); setLoading(false); return }
      const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`
      if (cleanHandle.length < 3) { setError('Handle must be at least 2 characters'); setLoading(false); return }
      const { error } = await signUp(email, password, { name: name.trim(), handle: cleanHandle, avatar: '👤' })
      if (error) {
        setError(error.message)
      } else {
        setConfirmSent(true)
      }
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  if (confirmSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Check your email</h1>
            <p className="text-sm text-slate-500 mt-2">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          </div>
          <button onClick={() => { setConfirmSent(false); setMode('login') }}
            className="w-full py-3 text-sm font-medium text-sky-600 hover:text-sky-700">
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Globe size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Wayfare</h1>
          <p className="text-sm text-slate-500 mt-1">Plan trips with your crew</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
            {[['login', 'Log In'], ['signup', 'Sign Up']].map(([id, label]) => (
              <button key={id} onClick={() => { setMode(id); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Display name" value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </div>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Handle (e.g. alexrivera)" value={handle}
                    onChange={e => setHandle(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </div>
              </>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" placeholder="Email" value={email} required
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" placeholder="Password" value={password} required minLength={6}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">or</span></div>
          </div>

          <button onClick={handleGoogleSignIn}
            className="w-full py-3 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
