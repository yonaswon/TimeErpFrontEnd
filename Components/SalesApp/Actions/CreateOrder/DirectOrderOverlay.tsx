'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Loader2, CheckCircle2, Package } from 'lucide-react'
import LeadSearchDropdown from './LeadSearchDropdown'
import DirectOrderItem from './DirectOrderItem'
import { useDirectOrderForm } from './useDirectOrderForm'
import { useFormData } from '../../Home/DetailLead/CreateOrderFromLead/hooks/useFormData'
import ContainerDetails from '../../Home/DetailLead/CreateOrderFromLead/Components/ContainerDetails'
import PaymentSection from '../../Home/DetailLead/CreateOrderFromLead/Components/PaymentSection'

interface DirectOrderOverlayProps {
    onClose: () => void
}

export default function DirectOrderOverlay({ onClose }: DirectOrderOverlayProps) {
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [success, setSuccess] = useState(false)

    const { designTypes, materials, wallets, loading } = useFormData()

    const {
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
    } = useDirectOrderForm({
        designTypes,
        wallets,
        onSuccess: () => setSuccess(true),
    })

    // Set default wallet
    useEffect(() => {
        if (wallets.length > 0 && !selectedWallet) {
            setSelectedWallet(wallets[0].id)
        }
    }, [wallets, selectedWallet, setSelectedWallet])

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Order Created Successfully!
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        The order container has been created and is ready for processing.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20">
            <form
                onSubmit={(e) => handleSubmit(e, selectedLead?.id, selectedLead)}
                className="bg-white dark:bg-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Order</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Create order container directly</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading form data...
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {/* Lead Selection */}
                            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-xl p-4">
                                <LeadSearchDropdown
                                    selectedLead={selectedLead}
                                    onSelectLead={setSelectedLead}
                                />
                            </div>

                            {/* Order Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                        Order Items ({items.length})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <DirectOrderItem
                                            key={index}
                                            index={index}
                                            item={item}
                                            designTypes={designTypes}
                                            onItemChange={handleItemChange}
                                            onRemove={removeItem}
                                            canRemove={items.length > 1}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Container Details */}
                            <ContainerDetails
                                totalPayment={totalPayment}
                                advancePayment={advancePayment}
                                remainingPayment={remainingPayment}
                                containerNote={containerNote}
                                specialRequirement={specialRequirement}
                                orderDifficulty={orderDifficulty}
                                location={location}
                                deliveryDate={deliveryDate}
                                installationService={installationService}
                                deliveryService={deliveryService}
                                onTotalPaymentChange={handleTotalPaymentChange}
                                onAdvancePaymentChange={handleAdvancePaymentChange}
                                onContainerNoteChange={setContainerNote}
                                onSpecialRequirementChange={setSpecialRequirement}
                                onOrderDifficultyChange={setOrderDifficulty}
                                onLocationChange={setLocation}
                                onDeliveryDateChange={setDeliveryDate}
                                onInstallationServiceChange={setInstallationService}
                                onDeliveryServiceChange={setDeliveryService}
                            />

                            {/* Payment Section */}
                            <PaymentSection
                                withInvoice={withInvoice}
                                setWithInvoice={setWithInvoice}
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                                selectedWallet={selectedWallet}
                                setSelectedWallet={setSelectedWallet}
                                selectedAccount={selectedAccount}
                                setSelectedAccount={setSelectedAccount}
                                paymentScreenshot={paymentScreenshot}
                                setPaymentScreenshot={setPaymentScreenshot}
                                invoiceImage={invoiceImage}
                                setInvoiceImage={setInvoiceImage}
                                paymentNote={paymentNote}
                                setPaymentNote={setPaymentNote}
                                wallets={wallets}
                                accounts={accounts}
                                setAccounts={setAccounts}
                            />
                        </div>
                    )}
                </div>

                {/* Fixed Footer - Submit Buttons */}
                <div className="flex justify-between p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !selectedLead}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating Order...
                            </>
                        ) : (
                            <>
                                <Package className="w-4 h-4" />
                                Create Order
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
