import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileFetchInFlight = useRef(false)
  const currentUserId = useRef(null)

  useEffect(() => {
    // Safety timeout: if auth takes more than 5 seconds, stop loading
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        currentUserId.current = sessionUser.id
        fetchProfile(sessionUser.id)
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user ?? null
        setUser(sessionUser)
        if (sessionUser) {
          // Only fetch if user changed (skip INITIAL_SESSION duplicate)
          if (currentUserId.current !== sessionUser.id) {
            currentUserId.current = sessionUser.id
            fetchProfile(sessionUser.id)
          }
        } else {
          currentUserId.current = null
          setProfile(null)
          profileFetchInFlight.current = false
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
    // Prevent concurrent fetches
    if (profileFetchInFlight.current) return
    profileFetchInFlight.current = true
    try {
      // Quick fetch — for existing users this returns immediately
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data)
        setLoading(false)
        return
      }
      // Profile doesn't exist yet (new user) — wait briefly for DB trigger, then retry
      await new Promise(r => setTimeout(r, 1000))
      const { data: retryData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (retryData) {
        setProfile(retryData)
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
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
    setLoading(false)
    profileFetchInFlight.current = false
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
    currentUserId.current = null
    profileFetchInFlight.current = false
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
