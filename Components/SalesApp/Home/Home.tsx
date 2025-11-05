'use client'
import { useEffect, useState } from 'react'
import StatisticsCard from './StatisticsCard'
import FilterBar from './FilterBar'
import LeadList from './LeadList'
import DetailLead from './DetailLead/DetailLead'
import CreateLeadOverlay from './CreateLeadOverlay' // NEW

const Home = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'your' | 'converted' | 'allLeads'>('all')
  const [filters, setFilters] = useState({
    dateRange: '',
    status: ''
  })
  const [userId, setUserId] = useState<number | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [showCreateOverlay, setShowCreateOverlay] = useState(false) // NEW

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

      {/* Create New Lead Button - Beautiful & Minimalist */}
      <div className="px-4 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-zinc-700">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setShowCreateOverlay(true)}
            className="group w-full max-w-sm mx-auto flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-zinc-800 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">Create New Lead</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Start a new customer journey</div>
            </div>
          </button>
        </div>
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

      {/* Create Lead Overlay */}
      {showCreateOverlay && (
        <CreateLeadOverlay 
          onClose={() => setShowCreateOverlay(false)}
          onSuccess={() => {
            setShowCreateOverlay(false)
            // You can add refresh logic here later
          }}
        />
      )}
    </div>
  )
}

export default Home