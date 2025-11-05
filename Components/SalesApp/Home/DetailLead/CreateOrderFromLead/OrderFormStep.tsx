'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Loader2, Plus, Trash2 } from 'lucide-react'
import api from '@/api'

interface OrderFormStepProps {
  leadId: number
  leadData: any
  selectedItems: any[]
  onBack: () => void
  onSuccess: () => void
  onClose: () => void
}

interface DesignType {
  id: number
  name: string
}

interface Material {
  id: number
  name: string
  type: string
  code_name: string
  available: number
}

interface Account {
  id: number
  bank: string
  available_amount: string
  account_number: string
  account_type: string
  account_name: string
  deleted: boolean
  date: string
}

interface Wallet {
  id: number
  name: string
  invoice_balance: string
  non_invoice_balance: string
  date: string
}

interface BomItem {
  id?: number
  material: number
  amount: string
  width: string
  height: string
  price_per_unit: string
  total_price: string
  estimated_price: string
  _tempId?: string
}

interface FormItem {
  id: number
  type: 'mockup' | 'modification'
  mockup_image: File | string | null
  design_type: number
  price: number
  note: string
  original_boms: any[]
  boms: BomItem[]
}

export default function OrderFormStep({
  leadId,
  leadData,
  selectedItems,
  onBack,
  onSuccess,
  onClose,
}: OrderFormStepProps) {
  const [items, setItems] = useState<FormItem[]>([])
  const [designTypes, setDesignTypes] = useState<DesignType[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [totalPayment, setTotalPayment] = useState(0)
  const [advancePayment, setAdvancePayment] = useState(0)
  const [remainingPayment, setRemainingPayment] = useState(0)
  const [containerNote, setContainerNote] = useState('')
  const [specialRequirement, setSpecialRequirement] = useState('')
  const [orderDifficulty, setOrderDifficulty] = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Payment fields
  const [withInvoice, setWithInvoice] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null)
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null)
  const [paymentNote, setPaymentNote] = useState('')

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [designRes, materialsRes, walletsRes] = await Promise.all([
          api.get('/lead/design-types/'),
          api.get('/materials/'),
          api.get('/finance/wallet/') // Correct wallet endpoint
        ])
        
        console.log('Design Types:', designRes.data)
        console.log('Materials:', materialsRes.data)
        console.log('Wallets:', walletsRes.data)
        
        setDesignTypes(designRes.data.results || designRes.data)
        setMaterials(materialsRes.data.results || materialsRes.data)
        setWallets(walletsRes.data.results || walletsRes.data)
        
        // Set default wallet (first wallet)
        const walletsData = walletsRes.data.results || walletsRes.data
        if (walletsData.length > 0) {
          setSelectedWallet(walletsData[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch accounts based on invoice selection
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accountType = withInvoice ? 'P' : 'C'
        const response = await api.get(`/finance/account/?account_type=${accountType}&deleted=false`)
        const accountsData = response.data.results || response.data
        console.log('Accounts:', accountsData)
        setAccounts(accountsData)
        setSelectedAccount(null) // Reset selection when account type changes
      } catch (err) {
        console.error('Failed to fetch accounts', err)
        setAccounts([])
      }
    }

    if (paymentMethod === 'BANK' || paymentMethod === 'CHECK') {
      fetchAccounts()
    } else {
      setAccounts([])
      setSelectedAccount(null)
    }
  }, [withInvoice, paymentMethod])

  // Initialize items from selectedItems after data is loaded
  useEffect(() => {
    if (loading) return

    const initItems: FormItem[] = selectedItems.map((item) => {
      const defaultDesignType = designTypes.length > 0 ? designTypes[0].id : 0
      const defaultMaterial = materials.length > 0 ? materials[0].id : 0

      console.log('Processing item:', item)
      console.log('Default design type:', defaultDesignType)
      console.log('Default material:', defaultMaterial)

      return {
        id: item.id,
        type: item.type,
        mockup_image: item.mockup_image || null,
        design_type: item.design_type || defaultDesignType,
        price: Math.round(item.price || 0),
        note: item.note || '',
        original_boms: item.bom || [],
        boms: (item.bom || []).map((bom: any) => ({
          id: bom.id,
          material: bom.material?.id || bom.material || defaultMaterial,
          amount: bom.amount?.toString() || '0',
          width: bom.width?.toString() || '0',
          height: bom.height?.toString() || '0',
          price_per_unit: bom.price_per_unit?.toString() || '0',
          total_price: bom.total_price?.toString() || '0',
          estimated_price: bom.estimated_price?.toString() || '0',
          _tempId: Math.random().toString(36).substr(2, 9)
        }))
      }
    })

    const itemsWithBoms = initItems.map(item => {
      if (item.boms.length === 0 && materials.length > 0) {
        return {
          ...item,
          boms: [{
            material: materials[0].id,
            amount: '0',
            width: '0',
            height: '0',
            price_per_unit: '0',
            total_price: '0',
            estimated_price: '0',
            _tempId: Math.random().toString(36).substr(2, 9)
          }]
        }
      }
      return item
    })

    console.log('Final items:', itemsWithBoms)
    setItems(itemsWithBoms)
    
    const full = itemsWithBoms.reduce((sum, i) => sum + i.price, 0)
    setTotalPayment(Math.round(full))
    setAdvancePayment(Math.round(full * 0.4))
    setRemainingPayment(Math.round(full * 0.6))
  }, [selectedItems, designTypes, materials, loading])

  // Handle per-item change
  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...items]
    
    if (field === 'price') {
      newItems[index][field] = Math.round(parseFloat(value) || 0)
    } else {
      newItems[index][field] = value
    }
    
    setItems(newItems)

    if (field === 'price') {
      const full = newItems.reduce((sum, i) => sum + i.price, 0)
      const ratio = totalPayment > 0 ? advancePayment / totalPayment : 0.4
      setTotalPayment(Math.round(full))
      setAdvancePayment(Math.round(full * ratio))
      setRemainingPayment(Math.round(full - full * ratio))
    }
  }

  // Handle BOM changes
  const handleBomChange = (itemIndex: number, bomIndex: number, field: keyof BomItem, value: string) => {
    const newItems = [...items]
    const bom = newItems[itemIndex].boms[bomIndex]
    
    bom[field] = value === '' ? '0' : value

    if ((field === 'amount' || field === 'price_per_unit') && bom.amount && bom.price_per_unit) {
      const amount = parseFloat(bom.amount) || 0
      const pricePerUnit = parseFloat(bom.price_per_unit) || 0
      bom.total_price = (amount * pricePerUnit).toFixed(2)
    }

    setItems(newItems)
  }

  // Add new BOM to item
  const addBom = (itemIndex: number) => {
    const newItems = [...items]
    const defaultMaterial = materials.length > 0 ? materials[0].id : 0
    newItems[itemIndex].boms.push({
      material: defaultMaterial,
      amount: '0',
      width: '0',
      height: '0',
      price_per_unit: '0',
      total_price: '0',
      estimated_price: '0',
      _tempId: Math.random().toString(36).substr(2, 9)
    })
    setItems(newItems)
  }

  // Remove BOM from item
  const removeBom = (itemIndex: number, bomIndex: number) => {
    const newItems = [...items]
    newItems[itemIndex].boms.splice(bomIndex, 1)
    setItems(newItems)
  }

  const handleTotalPaymentChange = (value: number) => {
    const ratio = totalPayment > 0 ? advancePayment / totalPayment : 0.4
    setTotalPayment(Math.round(value))
    setAdvancePayment(Math.round(value * ratio))
    setRemainingPayment(Math.round(value - value * ratio))
  }

  const handleAdvancePaymentChange = (value: number) => {
    setAdvancePayment(Math.round(value))
    setRemainingPayment(Math.round(totalPayment - value))
  }

  // Handle file uploads
  const handlePaymentScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentScreenshot(e.target.files?.[0] || null)
  }

  const handleInvoiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceImage(e.target.files?.[0] || null)
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validate form before submission
  const validationErrors = validateForm()
  if (validationErrors.length > 0) {
    alert('Please fix the following errors:\n' + validationErrors.join('\n'))
    return
  }

  setSubmitting(true)

  try {
    // Prepare BOM data - ensure no null values and proper data types
    const ordersData = items.map(item => {
      const designType = item.design_type || (designTypes.length > 0 ? designTypes[0].id : 1)
      const price = item.price || 0

      return {
        design_type: designType,
        order_status: 'PRE-ACCEPTED',
        mockup: item.type === 'mockup' ? item.id : null,
        mockup_modification: item.type === 'modification' ? item.id : null,
        price: price,
        note: item.note || '',
        boms_data: item.boms.map(bom => ({
          material: bom.material || (materials.length > 0 ? materials[0].id : 1),
          amount: parseFloat(bom.amount) || 0,
          width: parseFloat(bom.width) || 0,
          height: parseFloat(bom.height) || 0,
          price_per_unit: parseFloat(bom.price_per_unit) || 0,
          total_price: parseFloat(bom.total_price) || 0,
          estimated_price: parseFloat(bom.estimated_price) || 0
        }))
      }
    })

    console.log('Orders data to send:', ordersData)

    // Create FormData to handle file uploads
    const formData = new FormData()

    // Append all basic fields
    const payload = {
      posted_by: 1, // Will be overridden by backend
      lead_id: leadId,
      client: leadData.customer_name || 'Unknown Client',
      contact: leadData.customer_phonenumber || 'Unknown Contact',
      location: leadData.note || 'Unknown Location',
      delivery_date: new Date().toISOString(),
      invoice: withInvoice,
      full_payment: totalPayment,
      special_requerment: specialRequirement,
      advance_payment: parseFloat(advancePayment.toFixed(3)),
      remaining_payment: parseFloat(remainingPayment.toFixed(3)),
      instalation_service: true,
      order_difficulty: orderDifficulty,
      note: containerNote,
      delivery_service: true,
      wallet: selectedWallet,
      method: paymentMethod,
      account: selectedAccount,
      payment_note: paymentNote
    }

    // Append all payload fields to FormData
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString())
      }
    })

    // Append orders_data as JSON string
    formData.append('orders_data', JSON.stringify(ordersData))

    // Append files - CRITICAL: Payment screenshot for BANK/CHECK
    if (paymentMethod === 'BANK' || paymentMethod === 'CHECK') {
      if (!paymentScreenshot) {
        throw new Error('Payment screenshot is required for BANK and CHECK payments')
      }
      formData.append('payment_screenshot', paymentScreenshot)
    }

    // Invoice image if withInvoice is true
    if (withInvoice && invoiceImage) {
      formData.append('invoice_image', invoiceImage)
    }

    console.log('Sending form data with files...')
    
    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
      if (key === 'payment_screenshot' || key === 'invoice_image') {
        console.log(key, (value as File).name)
      } else {
        console.log(key, value)
      }
    }

    await api.post('/api/order-container/create/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    onSuccess()
  } catch (err: any) {
    console.error('Order creation error:', err)
    console.error('Error response:', err.response?.data)
    alert(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create order')
  } finally {
    setSubmitting(false)
  }
}

// Update the validation function to include file validation
const validateForm = () => {
  const errors: string[] = []

  // Check if design types and materials are loaded
  if (designTypes.length === 0) {
    errors.push('Design types are not loaded yet')
  }
  if (materials.length === 0) {
    errors.push('Materials are not loaded yet')
  }

  // Validate each item
  items.forEach((item, index) => {
    if (!item.design_type) {
      errors.push(`Design type is required for item ${index + 1}`)
    }
    if (!item.price && item.price !== 0) {
      errors.push(`Price is required for item ${index + 1}`)
    }
    if (item.price < 0) {
      errors.push(`Price cannot be negative for item ${index + 1}`)
    }
  })

  // Validate payment fields
  if (!selectedWallet) {
    errors.push('Wallet selection is required')
  }
  if (!paymentMethod) {
    errors.push('Payment method is required')
  }
  if ((paymentMethod === 'BANK' || paymentMethod === 'CHECK') && !selectedAccount) {
    errors.push('Account selection is required for bank or check payments')
  }
  
  // Validate payment screenshot for BANK/CHECK
  if ((paymentMethod === 'BANK' || paymentMethod === 'CHECK') && !paymentScreenshot) {
    errors.push('Payment screenshot is required for BANK and CHECK payments')
  }

  // Validate invoice image if withInvoice is true
  if (withInvoice && !invoiceImage) {
    errors.push('Invoice image is required when invoice is selected')
  }

  return errors
}

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading form data...
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Items List */}
      <div className="space-y-6">
        {items.map((item, itemIndex) => (
          <div key={item.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
            {/* Item Header */}
            <div className="flex items-start gap-4 mb-4">
              {/* Image */}
              <div className="shrink-0">
                <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-700 rounded-lg overflow-hidden flex items-center justify-center">
                  {item.mockup_image ? (
                    typeof item.mockup_image === 'string' ? (
                      <img src={item.mockup_image} alt="Mockup" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-gray-500 text-center p-2">New image selected</div>
                    )
                  ) : (
                    <div className="text-xs text-gray-500 text-center p-2">No image</div>
                  )}
                </div>
                <label className="flex items-center gap-1 cursor-pointer text-xs text-blue-600 dark:text-blue-400 mt-2">
                  <Upload className="w-3 h-3" />
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleItemChange(itemIndex, 'mockup_image', e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* Item Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Design Type *</label>
                  <select
                    value={item.design_type}
                    onChange={(e) => handleItemChange(itemIndex, 'design_type', parseInt(e.target.value))}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select design type</option>
                    {designTypes.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Price *</label>
                  <input
                    type="number"
                    value={item.price}
                    min={0}
                    step="1"
                    onChange={(e) => handleItemChange(itemIndex, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Note</label>
                  <textarea
                    value={item.note}
                    onChange={(e) => handleItemChange(itemIndex, 'note', e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                    rows={2}
                    placeholder="Add any notes for this order..."
                  />
                </div>
              </div>
            </div>

            {/* BOM Section */}
            <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Bill of Materials</h4>
                <button type="button" onClick={() => addBom(itemIndex)} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                  <Plus className="w-3 h-3" /> Add BOM
                </button>
              </div>

              <div className="space-y-3">
                {item.boms.map((bom, bomIndex) => (
                  <div key={bom._tempId} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-zinc-700 rounded">
                    {/* Material */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium">Material *</label>
                      <select
                        value={bom.material}
                        onChange={(e) => handleBomChange(itemIndex, bomIndex, 'material', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-600"
                        required
                      >
                        <option value="">Select material</option>
                        {materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.code_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="text-xs font-medium">Amount</label>
                      <input
                        type="number"
                        value={bom.amount}
                        step="0.001"
                        min="0"
                        onChange={(e) => handleBomChange(itemIndex, bomIndex, 'amount', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-600"
                        placeholder="0"
                      />
                    </div>

                    {/* Price per Unit */}
                    <div>
                      <label className="text-xs font-medium">Price/Unit</label>
                      <input
                        type="number"
                        value={bom.price_per_unit}
                        step="0.01"
                        min="0"
                        onChange={(e) => handleBomChange(itemIndex, bomIndex, 'price_per_unit', e.target.value)}
                        className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-600"
                        placeholder="0"
                      />
                    </div>

                    {/* Total Price */}
                    <div>
                      <label className="text-xs font-medium">Total Price</label>
                      <input
                        type="number"
                        value={bom.total_price}
                        readOnly
                        className="w-full p-1 text-xs border border-gray-300 dark:border-zinc-600 rounded bg-gray-100 dark:bg-zinc-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeBom(itemIndex, bomIndex)}
                        className="w-full p-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Container Level Fields */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Container Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Payment *</label>
            <input
              type="number"
              value={totalPayment}
              min={0}
              step="1"
              onChange={(e) => handleTotalPaymentChange(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Advance Payment *</label>
            <input
              type="number"
              value={advancePayment}
              min={0}
              step="0.001"
              onChange={(e) => handleAdvancePaymentChange(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Remaining Payment</label>
            <input
              type="number"
              value={remainingPayment}
              readOnly
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-gray-100 dark:bg-zinc-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Difficulty</label>
            <select
              value={orderDifficulty}
              onChange={(e) => setOrderDifficulty(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
            >
              <option value="SIMPLE">Simple</option>
              <option value="MEDIUM">Medium</option>
              <option value="DIFFICULT">Difficult</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Special Requirement</label>
            <input
              type="text"
              value={specialRequirement}
              onChange={(e) => setSpecialRequirement(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
              placeholder="Any special requirements..."
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Container Note</label>
          <textarea
            value={containerNote}
            onChange={(e) => setContainerNote(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
            rows={3}
            placeholder="Add any notes for the entire order container..."
          />
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={withInvoice}
                onChange={(e) => setWithInvoice(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              With Invoice
            </label>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
              required
            >
              <option value="">Select payment method</option>
              <option value="BANK">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
            </select>
          </div>
        </div>

        {/* Wallet Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet *</label>
          <select
            value={selectedWallet || ''}
            onChange={(e) => setSelectedWallet(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
            required
          >
            <option value="">Select wallet</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} (Invoice: {wallet.invoice_balance}, Non-Invoice: {wallet.non_invoice_balance})
              </option>
            ))}
          </select>
        </div>

        {/* Account Selection (only for BANK and CHECK) */}
        {(paymentMethod === 'BANK' || paymentMethod === 'CHECK') && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Account *</label>
            <select
              value={selectedAccount || ''}
              onChange={(e) => setSelectedAccount(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
              required
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank} - {account.account_number} ({account.account_name})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Screenshot (only for BANK and CHECK) */}
        {(paymentMethod === 'BANK' || paymentMethod === 'CHECK') && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Screenshot *</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400">
                <Upload className="w-4 h-4" />
                Upload Screenshot
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePaymentScreenshotChange}
                  required
                />
              </label>
              {paymentScreenshot && (
                <span className="text-sm text-green-600">{paymentScreenshot.name}</span>
              )}
            </div>
          </div>
        )}

        {/* Invoice Image (only when withInvoice is true) */}
        {withInvoice && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Image *</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400">
                <Upload className="w-4 h-4" />
                Upload Invoice
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleInvoiceImageChange}
                  required
                />
              </label>
              {invoiceImage && (
                <span className="text-sm text-green-600">{invoiceImage.name}</span>
              )}
            </div>
          </div>
        )}

        {/* Payment Note */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Note</label>
          <textarea
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
            rows={2}
            placeholder="Add any payment notes..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded font-medium"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Orders...
            </>
          ) : (
            'Create Orders'
          )}
        </button>
      </div>
    </form>
  )
}