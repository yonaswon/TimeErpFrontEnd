'use client'

interface AccountInfoProps {
  toAccountNumber: string
  toAccountName: string
  onAccountNumberChange: (value: string) => void
  onAccountNameChange: (value: string) => void
  disabled?: boolean
  required?: boolean
}

export const AccountInfo = ({
  toAccountNumber,
  toAccountName,
  onAccountNumberChange,
  onAccountNameChange,
  disabled = false,
  required = true
}: AccountInfoProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          To Account Name {required && <span className="text-red-500">*</span>}
        </label>
        <input
          value={toAccountName}
          onChange={(e) => onAccountNameChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          placeholder="Account holder name"
          disabled={disabled}
          required={required}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          To Account Number {required && <span className="text-red-500">*</span>}
        </label>
        <input
          value={toAccountNumber}
          onChange={(e) => onAccountNumberChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          placeholder="Account number"
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  )
}