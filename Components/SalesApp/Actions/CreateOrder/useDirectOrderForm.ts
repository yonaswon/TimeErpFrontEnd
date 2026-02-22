import { useState } from 'react'
import api from '@/api'

interface DirectOrderItem {
    mockup_image: File | null
    design_type: number
    price: number
    note: string
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

interface UseDirectOrderFormParams {
    designTypes: any[]
    wallets: any[]
    onSuccess: () => void
}

export function useDirectOrderForm({ designTypes, wallets, onSuccess }: UseDirectOrderFormParams) {
    // Order items
    const [items, setItems] = useState<DirectOrderItem[]>([
        { mockup_image: null, design_type: 0, price: 0, note: '' }
    ])

    // Container details
    const [totalPayment, setTotalPayment] = useState(0)
    const [advancePayment, setAdvancePayment] = useState(0)
    const [remainingPayment, setRemainingPayment] = useState(0)
    const [containerNote, setContainerNote] = useState('')
    const [specialRequirement, setSpecialRequirement] = useState('')
    const [orderDifficulty, setOrderDifficulty] = useState('MEDIUM')
    const [location, setLocation] = useState('')
    const [deliveryDate, setDeliveryDate] = useState('')
    const [installationService, setInstallationService] = useState(true)
    const [deliveryService, setDeliveryService] = useState(true)

    // Payment fields
    const [withInvoice, setWithInvoice] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('')
    const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
    const [selectedWallet, setSelectedWallet] = useState<number | null>(null)
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
    const [invoiceImage, setInvoiceImage] = useState<File | null>(null)
    const [paymentNote, setPaymentNote] = useState('')
    const [accounts, setAccounts] = useState<Account[]>([])
    const [submitting, setSubmitting] = useState(false)

    // Add new order item
    const addItem = () => {
        const defaultDesignType = designTypes.length > 0 ? designTypes[0].id : 0
        setItems(prev => [...prev, { mockup_image: null, design_type: defaultDesignType, price: 0, note: '' }])
    }

    // Remove order item
    const removeItem = (index: number) => {
        setItems(prev => {
            const newItems = prev.filter((_, i) => i !== index)
            // Recalculate totals
            const full = newItems.reduce((sum, i) => sum + i.price, 0)
            const ratio = totalPayment > 0 ? advancePayment / totalPayment : 0.5
            setTotalPayment(Math.round(full))
            setAdvancePayment(Math.round(full * ratio))
            setRemainingPayment(Math.round(full - full * ratio))
            return newItems
        })
    }

    // Update order item field
    const handleItemChange = (index: number, field: string, value: any) => {
        setItems(prev => {
            const newItems = [...prev]
            if (field === 'price') {
                (newItems[index] as any)[field] = Math.round(parseFloat(value) || 0)
            } else {
                (newItems[index] as any)[field] = value
            }

            if (field === 'price') {
                const full = newItems.reduce((sum, i) => sum + i.price, 0)
                const ratio = totalPayment > 0 ? advancePayment / totalPayment : 0.5
                setTotalPayment(Math.round(full))
                setAdvancePayment(Math.round(full * ratio))
                setRemainingPayment(Math.round(full - full * ratio))
            }

            return newItems
        })
    }

    const handleTotalPaymentChange = (value: number) => {
        const ratio = totalPayment > 0 ? advancePayment / totalPayment : 0.5
        setTotalPayment(Math.round(value))
        setAdvancePayment(Math.round(value * ratio))
        setRemainingPayment(Math.round(value - value * ratio))
    }

    const handleAdvancePaymentChange = (value: number) => {
        setAdvancePayment(Math.round(value))
        setRemainingPayment(Math.round(totalPayment - value))
    }

    // Submit form
    const handleSubmit = async (e: React.FormEvent, leadId: number, leadData: any) => {
        e.preventDefault()

        // Validation
        const errors: string[] = []
        if (!leadId) errors.push('Please select a lead')
        if (!location) errors.push('Location is required')
        if (!deliveryDate) errors.push('Delivery date is required')
        if (!paymentMethod) errors.push('Payment method is required')
        if ((paymentMethod === 'BANK' || paymentMethod === 'CHECK') && !selectedAccount) {
            errors.push('Account selection is required for bank or check payments')
        }
        if ((paymentMethod === 'BANK' || paymentMethod === 'CHECK') && !paymentScreenshot) {
            errors.push('Payment screenshot is required for BANK and CHECK payments')
        }

        items.forEach((item, index) => {
            if (!item.mockup_image) errors.push(`Mockup image is required for order #${index + 1}`)
            if (!item.design_type) errors.push(`Design type is required for order #${index + 1}`)
        })

        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'))
            return
        }

        setSubmitting(true)

        try {
            const ordersData = items.map((item) => {
                const designType = item.design_type || (designTypes.length > 0 ? designTypes[0].id : 1)
                return {
                    design_type: designType,
                    order_status: 'PRE-ACCEPTED',
                    mockup: null,
                    mockup_modification: null,
                    price: item.price || 0,
                    boms_data: [],
                }
            })

            const formData = new FormData()

            const payload: Record<string, any> = {
                posted_by: 1,
                lead_id: leadId,
                client: leadData.customer_name || 'Unknown Client',
                contact: leadData.customer_phonenumber || 'Unknown Contact',
                location: location,
                delivery_date: new Date(deliveryDate).toISOString(),
                invoice: withInvoice,
                full_payment: totalPayment,
                special_requerment: specialRequirement,
                advance_payment: parseFloat(advancePayment.toFixed(3)),
                remaining_payment: parseFloat(remainingPayment.toFixed(3)),
                instalation_service: installationService,
                order_difficulty: orderDifficulty,
                note: containerNote,
                delivery_service: deliveryService,
                wallet: selectedWallet,
                method: paymentMethod,
                account: selectedAccount,
                payment_note: paymentNote,
            }

            Object.entries(payload).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value.toString())
                }
            })

            formData.append('orders_data', JSON.stringify(ordersData))

            // Append mockup images
            items.forEach((item, index) => {
                if (item.mockup_image instanceof File) {
                    formData.append(`order_${index}_mockup_image`, item.mockup_image)
                }
            })

            if (paymentMethod === 'BANK' || paymentMethod === 'CHECK') {
                if (paymentScreenshot) {
                    formData.append('payment_screenshot', paymentScreenshot)
                }
            }

            if (withInvoice && invoiceImage) {
                formData.append('invoice_image', invoiceImage)
            }

            await api.post('/api/order-container/create/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            onSuccess()
        } catch (err: any) {
            console.error('Order creation error:', err)
            alert(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Failed to create order'
            )
        } finally {
            setSubmitting(false)
        }
    }

    return {
        // State
        items,
        totalPayment,
        advancePayment,
        remainingPayment,
        containerNote,
        specialRequirement,
        orderDifficulty,
        location,
        deliveryDate,
        installationService,
        deliveryService,
        withInvoice,
        paymentMethod,
        selectedAccount,
        selectedWallet,
        paymentScreenshot,
        invoiceImage,
        paymentNote,
        accounts,
        submitting,

        // Setters
        setContainerNote,
        setSpecialRequirement,
        setOrderDifficulty,
        setLocation,
        setDeliveryDate,
        setInstallationService,
        setDeliveryService,
        setWithInvoice,
        setPaymentMethod,
        setSelectedAccount,
        setSelectedWallet,
        setPaymentScreenshot,
        setInvoiceImage,
        setPaymentNote,
        setAccounts,

        // Handlers
        addItem,
        removeItem,
        handleItemChange,
        handleTotalPaymentChange,
        handleAdvancePaymentChange,
        handleSubmit,
    }
}
