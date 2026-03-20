import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    // Retry up to 3 times with delay — the trigger that creates the profile may not have finished yet
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data)
        setLoading(false)
        return
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
    }
    // If still no profile after retries, create a minimal one
    const { data: userData } = await supabase.auth.getUser()
    const email = userData?.user?.email || ''
    const name = userData?.user?.user_metadata?.name || userData?.user?.user_metadata?.full_name || email.split('@')[0]
    const handle = '@' + email.split('@')[0].replace(/\./g, '').toLowerCase()
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({ id: userId, handle, name, avatar: '👤', bio: '' }, { onConflict: 'id' })
      .select()
      .single()
    setProfile(newProfile)
    setLoading(false)
  }

  async function signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: metadata }
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    })
    return { data, error }
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  const value = {
    user, profile, loading,
    signUp, signIn, signInWithGoogle, signOut,
    updateProfile, fetchProfile: () => user && fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
