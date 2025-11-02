'use client'
import { useEffect, useState } from 'react'
import StatisticsCard from './StatisticsCard'
import FilterBar from './FilterBar'
import LeadList from './LeadList'
import DetailLead from './DetailLead/DetailLead'

const Home = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'your' | 'converted' | 'allLeads'>('all')
  const [filters, setFilters] = useState({
    dateRange: '',
    status: ''
  })
  const [userId, setUserId] = useState<number | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)

  useEffect(() => {
    // Get user ID from localStorage
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsedData = JSON.parse(userData)
        setUserId(parsedData.id)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleLeadClick = (leadId: number) => {
    setSelectedLeadId(leadId)
  }

  const handleCloseDetail = () => {
    setSelectedLeadId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Statistics Cards */}
      <div className="p-4">
        <StatisticsCard userId={userId} filters={filters} />
      </div>

      {/* Horizontal Navigation */}
      <div className="px-4 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'your', label: 'Your Leads' },
            { id: 'converted', label: 'Converted' },
            { id: 'allLeads', label: 'All Leads' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 whitespace-nowrap font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filter Bar - Only show for "All" tab */}
      {activeTab === 'all' && (
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <FilterBar onFilterChange={handleFilterChange} />
          </div>
        </div>
      )}

      {/* Lead List */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <LeadList 
            activeTab={activeTab} 
            filters={filters}
            userId={userId}
            onLeadClick={handleLeadClick}
          />
        </div>
      </div>

      {/* Detail Lead Overlay */}
      {selectedLeadId && (
        <DetailLead 
          leadId={selectedLeadId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}

export default Home