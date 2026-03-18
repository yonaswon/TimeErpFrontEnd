import { useState } from 'react'
import api from '@/api'

interface DirectOrderItem {
    mockup_image: File | null
    design_type: number
    price: number
    note: string
    order_name: string
}

interface PaymentEntry {
    method: string
    amount: number
    wallet: number | null
    account: number | null
    transaction_id: string
    account_transaction_length?: number | null
    screenshot: File | null
    note: string
}

interface UseDirectOrderFormParams {
    designTypes: any[]
    wallets: any[]
    onSuccess: () => void
}

export function useDirectOrderForm({ designTypes, wallets, onSuccess }: UseDirectOrderFormParams) {
    // Order items
    const [items, setItems] = useState<DirectOrderItem[]>([
        { mockup_image: null, design_type: 0, price: 0, note: '', order_name: '' }
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

    // Invoice (global)
    const [withInvoice, setWithInvoice] = useState(false)
    const [invoiceImage, setInvoiceImage] = useState<File | null>(null)

    // Multiple payments
    const [payments, setPayments] = useState<PaymentEntry[]>([
        { method: '', amount: 0, wallet: null, account: null, transaction_id: '', account_transaction_length: null, screenshot: null, note: '' }
    ])

    const [submitting, setSubmitting] = useState(false)

    // Add new order item
    const addItem = () => {
        const defaultDesignType = designTypes.length > 0 ? designTypes[0].id : 0
        setItems(prev => [...prev, { mockup_image: null, design_type: defaultDesignType, price: 0, note: '', order_name: '' }])
    }

    // Remove order item
    const removeItem = (index: number) => {
        setItems(prev => {
            const newItems = prev.filter((_, i) => i !== index)
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

        items.forEach((item, index) => {
            if (!item.mockup_image) errors.push(`Mockup image is required for order #${index + 1}`)
            if (!item.design_type) errors.push(`Design type is required for order #${index + 1}`)
        })

        // Validate payments
        if (payments.length === 0) errors.push('At least one payment is required')
        payments.forEach((p, i) => {
            if (!p.method) errors.push(`Payment #${i + 1}: method is required`)
            if (!p.amount || p.amount <= 0) errors.push(`Payment #${i + 1}: amount must be > 0`)
            if ((p.method === 'BANK' || p.method === 'CHECK') && !p.account) {
                errors.push(`Payment #${i + 1}: account is required for ${p.method}`)
            }
            if (p.method === 'BANK') {
                if (!p.transaction_id || p.transaction_id.trim() === '') {
                    errors.push(`Payment #${i + 1}: transaction ID is required for BANK transfer`)
                } else if (p.account_transaction_length && p.transaction_id.trim().length !== p.account_transaction_length) {
                    errors.push(`Payment #${i + 1}: transaction ID must be exactly ${p.account_transaction_length} characters`)
                }
            }
            if ((p.method === 'BANK' || p.method === 'CHECK') && !p.screenshot) {
                errors.push(`Payment #${i + 1}: screenshot is required for ${p.method}`)
            }
        })
        const totalAllocated = payments.reduce((s, p) => s + p.amount, 0)
        if (Math.round(totalAllocated) !== Math.round(advancePayment)) {
            errors.push(`Total payment amounts (${totalAllocated}) must equal advance payment (${advancePayment})`)
        }

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
                    order_name: item.order_name || '',
                    mockup: null,
                    mockup_modification: null,
                    price: item.price || 0,
                    boms_data: [],
                }
            })

            const formData = new FormData()

            // Build payments_data (without screenshot files)
            const paymentsData = payments.map((p) => ({
                method: p.method,
                amount: p.amount,
                wallet: p.wallet,
                account: p.account,
                transaction_id: p.transaction_id || '',
                note: p.note,
            }))

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
            }

            Object.entries(payload).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value.toString())
                }
            })

            formData.append('orders_data', JSON.stringify(ordersData))
            formData.append('payments_data', JSON.stringify(paymentsData))

            // Append mockup images
            items.forEach((item, index) => {
                if (item.mockup_image instanceof File) {
                    formData.append(`order_${index}_mockup_image`, item.mockup_image)
                }
            })

            // Append payment screenshots
            payments.forEach((p, index) => {
                if ((p.method === 'BANK' || p.method === 'CHECK') && p.screenshot) {
                    formData.append(`payment_${index}_screenshot`, p.screenshot)
                }
            })

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
        invoiceImage,
        payments,
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
        setInvoiceImage,
        setPayments,

        // Handlers
        addItem,
        removeItem,
        handleItemChange,
        handleTotalPaymentChange,
        handleAdvancePaymentChange,
        handleSubmit,
    }
}
