'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, X, User, Phone, Loader2 } from 'lucide-react'
import api from '@/api'

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
}

interface LeadSearchDropdownProps {
    selectedLead: Lead | null
    onSelectLead: (lead: Lead | null) => void
}

export default function LeadSearchDropdown({ selectedLead, onSelectLead }: LeadSearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch leads when search query changes
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
            fetchLeads(searchQuery)
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [searchQuery])

    // Fetch on initial open
    useEffect(() => {
        if (isOpen && leads.length === 0) {
            fetchLeads('')
        }
    }, [isOpen])

    const fetchLeads = async (query: string) => {
        try {
            setLoading(true)
            let url = '/lead/leads/?ordering=-created_at'
            if (query.trim()) {
                url += `&search=${encodeURIComponent(query.trim())}`
            }
            const response = await api.get(url)
            const data = response.data.results || response.data
            setLeads(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Failed to fetch leads', err)
            setLeads([])
        } finally {
            setLoading(false)
        }
    }

    const handleSelectLead = (lead: Lead) => {
        onSelectLead(lead)
        setIsOpen(false)
        setSearchQuery('')
    }

    const handleClear = () => {
        onSelectLead(null)
        setSearchQuery('')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'HOT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            case 'WARM': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            case 'COLD': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            case 'CONVERTED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        }
    }

    return (
        <div ref={dropdownRef} className="relative">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Select Lead *
            </label>

            {/* Selected Lead Display / Trigger */}
            {selectedLead ? (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {selectedLead.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(selectedLead.status)}`}>
                                {selectedLead.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {selectedLead.customer_name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {selectedLead.customer_phonenumber}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-2 p-3 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left"
                >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm text-gray-400">Search and select a lead...</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-xl shadow-xl max-h-72 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 dark:border-zinc-700">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-700 rounded-lg">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, customer, phone..."
                                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder-gray-400"
                                autoFocus
                            />
                            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-56 overflow-y-auto">
                        {leads.length === 0 && !loading ? (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery ? 'No leads found' : 'No leads available'}
                            </div>
                        ) : (
                            leads.map((lead) => (
                                <button
                                    key={lead.id}
                                    type="button"
                                    onClick={() => handleSelectLead(lead)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-left border-b border-gray-50 dark:border-zinc-700/50 last:border-b-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {lead.name}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {lead.customer_name}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {lead.customer_phonenumber}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
