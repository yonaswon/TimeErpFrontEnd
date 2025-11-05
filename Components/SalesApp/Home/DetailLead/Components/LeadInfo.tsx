'use client'
import { useState } from 'react'
import { User, Phone, MessageCircle, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react'

interface Lead {
  id: number
  name: string
  status: string
  customer_name: string
  customer_phonenumber: string
  customer_telegram: string
  note: string
  sales: number
  created_at: string
  converted_at: string | null
  mark_cold_at: string | null
}

interface LeadInfoProps {
  lead: Lead
}

const Badge = ({ children, variant = 'gray' }: { children: React.ReactNode; variant?: string }) => {
  const map: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${map[variant] || map.gray}`}>
      {children}
    </span>
  )
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'NEW': return 'blue'
    case 'WARM': return 'yellow'
    case 'COLD': return 'gray'
    case 'CONVERTED': return 'green'
    default: return 'gray'
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function LeadInfo({ lead }: LeadInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden transition-all duration-300 ease-in-out">
      {/* Always visible header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleExpand}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-all duration-200 text-gray-500 dark:text-gray-400 transform hover:scale-105"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg transition-transform duration-200 hover:scale-105">
              {lead.customer_name?.charAt(0) || lead.name?.charAt(0) || 'L'}
            </div>
            
            <div className="transition-all duration-300">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  {lead.customer_name || lead.name || 'Unnamed Lead'}
                </h2>
                <Badge variant={getStatusVariant(lead.status)}>
                  {lead.status}
                </Badge>
              </div>
              {/* <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">
                <Tag className="w-3 h-3" />
                {lead.design_type.name}
              </div> */}
            </div>
          </div>
          
          <div className="text-right transition-opacity duration-300">
            <div className="text-xs text-gray-500 dark:text-gray-400">Sales ID</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">#{lead.sales}</div>
          </div>
        </div>
      </div>

      {/* Expandable content with smooth transition */}
      <div className={`
        transition-all duration-300 ease-in-out overflow-hidden
        ${isExpanded ? 'max-h-96 opacity-100 pb-4 px-4' : 'max-h-0 opacity-0'}
      `}>
        <div className={`
          transition-all duration-500 ease-in-out
          ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>
          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-700/50 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-600/50">
              <Phone className="w-4 h-4 text-blue-500 transition-transform duration-200 hover:scale-110" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {lead.customer_phonenumber || 'Not provided'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-700/50 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-600/50">
              <MessageCircle className="w-4 h-4 text-green-500 transition-transform duration-200 hover:scale-110" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Telegram</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {lead.customer_telegram || 'Not provided'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-700/50 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-600/50">
              <Calendar className="w-4 h-4 text-orange-500 transition-transform duration-200 hover:scale-110" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(lead.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Info */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="transition-all duration-200 hover:translate-x-1">
              <div className="text-gray-500 dark:text-gray-400 text-xs">Converted</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(lead.converted_at)}
              </div>
            </div>
            <div className="transition-all duration-200 hover:translate-x-1">
              <div className="text-gray-500 dark:text-gray-400 text-xs">Marked Cold</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(lead.mark_cold_at)}
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.note && (
            <div className="pt-4 border-t border-gray-200 dark:border-zinc-600 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2 transition-colors duration-200">
                <User className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
                Notes
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-700/30 rounded-lg p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-600/30">
                {lead.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}