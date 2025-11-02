'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react'
import api from '@/api'

interface Account {
  id: number
  bank: string
  available_amount: string
  account_number: string
  account_type: string
  account_name: string
}

interface AdminAccountDropdownProps {
  value: number | null
  onChange: (accountId: number | null) => void
  disabled?: boolean
  required?: boolean
  invoice?: boolean
}

export const AdminAccountDropdown = ({ value, onChange, disabled = false, required = false, invoice = false }: AdminAccountDropdownProps) => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedAccount = accounts.find(a => a.id === value)

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true)
      setError(null)
      try {
        // Determine account type based on invoice prop
        const accountType = invoice ? 'C' : 'P'
        const response = await api.get('/finance/account/', {
          params: { account_type: accountType, deleted: false }
        })
        setAccounts(response.data.results || response.data || [])
      } catch (err: any) {
        console.error('Error fetching accounts:', err)
        setError(err.response?.data?.message || 'Failed to load accounts')
        setAccounts([])
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchAccounts()
    }
  }, [isOpen, invoice])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (account: Account) => {
    onChange(account.id)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative w-full mt-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        From Account {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
            !selectedAccount ? 'text-gray-500 dark:text-gray-400' : ''
          }`}
        >
          {selectedAccount ? (
            <div>
              <div className="font-medium">{selectedAccount.account_name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedAccount.bank} • {selectedAccount.account_number}
              </div>
            </div>
          ) : (
            'Select account'
          )}
        </button>
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 size={16} className="text-blue-500 animate-spin" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center px-3 py-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span>Loading accounts...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
              <AlertCircle size={16} />
              <div>
                <div className="font-medium">Failed to load accounts</div>
                <div className="text-xs opacity-75">{error}</div>
              </div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No {invoice ? 'current' : 'personal'} accounts found
            </div>
          ) : (
            accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSelect(account)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-between ${
                  value === account.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{account.account_name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {account.bank} • {account.account_number}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Available: {parseFloat(account.available_amount).toLocaleString()} ETB
                  </div>
                </div>
                {value === account.id && <Check size={16} className="text-blue-500 shrink-0 ml-2" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}