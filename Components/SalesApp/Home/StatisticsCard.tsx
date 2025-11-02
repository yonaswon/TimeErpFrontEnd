'use client'
import { useEffect, useState } from 'react'
import api from '@/api'

interface StatisticsData {
  totalLeads: number
  convertedToday: number
  newLeads: number
  warmLeads: number
}

interface StatisticsCardProps {
  userId: number | null
  filters: any
}

const StatisticsCard = ({ userId, filters }: StatisticsCardProps) => {
  const [stats, setStats] = useState<StatisticsData>({
    totalLeads: 0,
    convertedToday: 0,
    newLeads: 0,
    warmLeads: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!userId) return

      try {
        setLoading(true)
        
        const params: any = {
          sales: userId.toString()
        }

        if (filters.dateRange) {
          if (filters.dateRange === 'today') {
            params.created_today = 'true'
          } else if (filters.dateRange === 'yesterday') {
            params.created_yesterday = 'true'
          } else if (filters.dateRange === 'last_7_days') {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            params.created_after = sevenDaysAgo.toISOString().split('T')[0]
          }
        }

        const response = await api.get('/lead/leads/', { params })
        const leads = response.data.results || response.data
        
        calculateStatistics(leads)
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [userId, filters])

  const calculateStatistics = (leads: any[]) => {
    const today = new Date().toDateString()
    
    const statistics: StatisticsData = {
      totalLeads: leads.length,
      convertedToday: leads.filter(lead => 
        lead.status === 'CONVERTED' && 
        lead.converted_at && 
        new Date(lead.converted_at).toDateString() === today
      ).length,
      newLeads: leads.filter(lead => lead.status === 'NEW').length,
      warmLeads: leads.filter(lead => lead.status === 'WARM').length
    }

    setStats(statistics)
  }

  const statCards = [
    {
      title: 'Total',
      value: stats.totalLeads,
      color: 'blue',
    },
    {
      title: 'Converted Today',
      value: stats.convertedToday,
      color: 'green',
    },
    {
      title: 'New',
      value: stats.newLeads,
      color: 'purple',
    },
    {
      title: 'Warm',
      value: stats.warmLeads,
      color: 'orange',
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded mb-1"></div>
            <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`rounded-lg p-3 border text-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}
        >
          <div className="text-lg font-bold">{stat.value}</div>
          <div className="text-xs font-medium">{stat.title}</div>
        </div>
      ))}
    </div>
  )
}

export default StatisticsCard