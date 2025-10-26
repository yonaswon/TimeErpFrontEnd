import { useState, useEffect } from 'react'
import api from '@/api'

export interface UserData {
  telegram_id: number
  telegram_user_name: string
  role: Array<{
    id: number
    Name: string
    date: string
  }>
}

export const useTelegramAuth = () => {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const storedUserData = localStorage.getItem('user_data')
      
      if (accessToken && storedUserData) {
        const parsedUserData = JSON.parse(storedUserData)
        // Only use stored data if user has roles
        if (parsedUserData.roles && parsedUserData.roles.length > 0) {
          setUserData(parsedUserData)
          setLoading(false)
          return
        } else {
          // Clear storage if no roles
          console.log(accessToken,'acess token')
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')
        }
      }
      
      // No valid token or no roles, try Telegram auth
      await handleTelegramAuth()
    } catch (err) {
      console.error('Auth error:', err)
      setError('Authentication failed')
      setLoading(false)
    }
  }

  const handleTelegramAuth = async () => {
    try {
      if (!window.Telegram?.WebApp) {
        setError('Telegram WebApp not available')
        setLoading(false)
        return
      }

      const initData = window?.Telegram?.WebApp.initData
      
      if (!initData) {
        setError('No init data from Telegram')
        setLoading(false)
        return
      }

      const response = await api.post('/core/telegram-login/', {
        init_data: initData
      })
      console.log(response,'response form teh telegram login')

      if (response.data.access && response.data.user) {
        const userData = response.data.user
        console.log(response.data.access,'acess token')
        
        // Only store if user has roles
        if (userData.role && userData.role.length > 0) {
          localStorage.setItem('access_token', response.data.access)
          localStorage.setItem('user_data', JSON.stringify(userData))
        }
        
        setUserData(userData)
      } else {
        setError('No access token or user data received')
      }
      setLoading(false)
    } catch (err: any) {
      console.error('Telegram auth error:', err)
      setError(err.response?.data?.detail || err.response?.data?.message || 'Telegram authentication failed')
      setLoading(false)
    }
  }

  const retryAuth = () => {
    setError(null)
    setLoading(true)
    checkAuth()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return {
    userData,
    loading,
    error,
    retryAuth
  }
}