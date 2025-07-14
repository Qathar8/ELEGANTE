import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  username: string
  role: 'super_admin' | 'admin' | 'sales_staff'
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('elegante_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    
    // Create default admin user if it doesn't exist
    createDefaultAdmin()
    
    setLoading(false)
  }, [])

  const createDefaultAdmin = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-helpers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create_default_admin' })
      })

      const result = await response.json()
      if (result.success) {
        console.log('Default admin setup completed')
      }
    } catch (error) {
      console.error('Error setting up default admin:', error)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-helpers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'login',
          username,
          password
        })
      })

      const result = await response.json()
      
      if (result.success && result.user) {
        const userData = {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role
        }

        setUser(userData)
        localStorage.setItem('elegante_user', JSON.stringify(userData))
        return true
      }

      console.error('Login failed:', result.error)
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('elegante_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}