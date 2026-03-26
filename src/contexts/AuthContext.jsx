import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileFetched = useRef(false)

  useEffect(() => {
    // Safety timeout: if auth takes more than 10 seconds, stop loading
    const safetyTimer = setTimeout(() => {
      if (loading) setLoading(false)
    }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const prev = user
        setUser(session?.user ?? null)
        if (session?.user) {
          // Only fetch profile if we don't already have one or if user changed
          if (!profileFetched.current || prev?.id !== session.user.id) {
            await fetchProfile(session.user.id)
          }
        } else {
          setProfile(null)
          profileFetched.current = false
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      // First try: quick fetch
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data)
        profileFetched.current = true
        setLoading(false)
        return
      }
      // Profile doesn't exist yet (new user) — wait for trigger then retry
      await new Promise(r => setTimeout(r, 1500))
      const { data: retryData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (retryData) {
        setProfile(retryData)
        profileFetched.current = true
        setLoading(false)
        return
      }
      // Still no profile — create one
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
      profileFetched.current = true
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
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
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' }
      }
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    profileFetched.current = false
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
