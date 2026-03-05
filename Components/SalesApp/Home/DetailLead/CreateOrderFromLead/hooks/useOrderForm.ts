import { useState, useEffect } from "react";
import api from "@/api";
import { FormItem, Account, PaymentEntry } from "../types";

interface UseOrderFormParams {
  leadId: number;
  leadData: any;
  selectedItems: any[];
  designTypes: any[];
  materials: any[];
  wallets: any[];
  onSuccess: () => void;
  validateForm: (params: any) => string[];
}

export function useOrderForm({
  leadId,
  leadData,
  selectedItems,
  designTypes,
  materials,
  wallets,
  onSuccess,
  validateForm,
}: UseOrderFormParams) {
  const [items, setItems] = useState<FormItem[]>([]);
  const [totalPayment, setTotalPayment] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [remainingPayment, setRemainingPayment] = useState(0);
  const [containerNote, setContainerNote] = useState("");
  const [specialRequirement, setSpecialRequirement] = useState("");
  const [orderDifficulty, setOrderDifficulty] = useState("MEDIUM");
  const [location, setLocation] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [installationService, setInstallationService] = useState(true);
  const [deliveryService, setDeliveryService] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Invoice (global)
  const [withInvoice, setWithInvoice] = useState(false);
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);

  // Multiple payments
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { method: '', amount: 0, wallet: null, account: null, screenshot: null, note: '' }
  ]);

  // Initialize items from selectedItems and set default delivery date
  useEffect(() => {
    const initItems: FormItem[] = selectedItems.map((item) => {
      const defaultDesignType = designTypes.length > 0 ? designTypes[0].id : 0;

      return {
        id: item.id,
        type: item.type,
        name: item.name,
        order_name: item.name || '',
        mockup_image: item.mockup_image || null,
        design_type: item.design_type || defaultDesignType,
        price: Math.round(item.price || 0),
        note: item.note || "",
        original_boms: [],
        boms: [],
      };
    });

    setItems(initItems);

    const full = initItems.reduce((sum, i) => sum + i.price, 0);
    setTotalPayment(Math.round(full));
    setAdvancePayment(Math.round(full * 0.5));
    setRemainingPayment(Math.round(full * 0.5));

    // Set the first payment amount to the advance payment
    setPayments([{ method: '', amount: Math.round(full * 0.5), wallet: null, account: null, screenshot: null, note: '' }]);
  }, [selectedItems, designTypes, leadData]);

  const handleItemChange = (
    index: number,
    field: keyof FormItem,
    value: any
  ) => {
    const newItems: any = [...items];

    if (field === "price") {
      newItems[index][field] = Math.round(parseFloat(value) || 0);
    } else {
      newItems[index][field] = value;
    }

    setItems(newItems);

    if (field === "price") {
      const full = newItems.reduce((sum: any, i: any) => sum + i.price, 0);
      const ratio = totalPayment > 0 ? advancePayment / totalPayment : 0.4;
      setTotalPayment(Math.round(full));
      setAdvancePayment(Math.round(full * ratio));
      setRemainingPayment(Math.round(full - full * ratio));
    }
  };

  const handleTotalPaymentChange = (value: number) => {
    const ratio = totalPayment > 0 ? advancePayment / totalPayment : 0.4;
    setTotalPayment(Math.round(value));
    setAdvancePayment(Math.round(value * ratio));
    setRemainingPayment(Math.round(value - value * ratio));
  };

  const handleAdvancePaymentChange = (value: number) => {
    setAdvancePayment(Math.round(value));
    setRemainingPayment(Math.round(totalPayment - value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate payments
    const paymentErrors: string[] = [];
    if (payments.length === 0) paymentErrors.push('At least one payment is required');
    payments.forEach((p, i) => {
      if (!p.method) paymentErrors.push(`Payment #${i + 1}: method is required`);
      if (!p.amount || p.amount <= 0) paymentErrors.push(`Payment #${i + 1}: amount must be > 0`);
      if ((p.method === 'BANK' || p.method === 'CHECK') && !p.account) {
        paymentErrors.push(`Payment #${i + 1}: account is required for ${p.method}`);
      }
      if ((p.method === 'BANK' || p.method === 'CHECK') && !p.screenshot) {
        paymentErrors.push(`Payment #${i + 1}: screenshot is required for ${p.method}`);
      }
    });
    const totalAllocated = payments.reduce((s, p) => s + p.amount, 0);
    if (Math.round(totalAllocated) !== Math.round(advancePayment)) {
      paymentErrors.push(`Total payment amounts (${totalAllocated}) must equal advance payment (${advancePayment})`);
    }

    const validationErrors = validateForm({
      items,
      designTypes,
      payments,
      withInvoice,
      invoiceImage,
      location,
      deliveryDate,
    });

    const allErrors = [...validationErrors, ...paymentErrors];
    if (allErrors.length > 0) {
      alert("Please fix the following errors:\n" + allErrors.join("\n"));
      return;
    }

    setSubmitting(true);

    try {
      const ordersData = items.map((item) => {
        const designType =
          item.design_type || (designTypes.length > 0 ? designTypes[0].id : 1);
        const price = item.price || 0;

        return {
          design_type: designType,
          order_status: "PRE-ACCEPTED",
          order_name: item.order_name || '',
          mockup: item.type === "mockup" ? item.id : null,
          mockup_modification: item.type === "modification" ? item.id : null,
          price: price,
          note: item.note || "",
          boms_data: [],
        };
      });

      const formData = new FormData();

      // Build payments_data (without screenshot files)
      const paymentsData = payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        wallet: p.wallet,
        account: p.account,
        note: p.note,
      }));

      const payload: Record<string, any> = {
        posted_by: 1,
        lead_id: leadId,
        client: leadData.customer_name || "Unknown Client",
        contact: leadData.customer_phonenumber || "Unknown Contact",
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
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      formData.append("orders_data", JSON.stringify(ordersData));
      formData.append("payments_data", JSON.stringify(paymentsData));

      // Append mockup images if they are new files
      items.forEach((item, index) => {
        if (item.mockup_image instanceof File) {
          formData.append(`order_${index}_mockup_image`, item.mockup_image);
        }
      });

      // Append payment screenshots
      payments.forEach((p, index) => {
        if ((p.method === 'BANK' || p.method === 'CHECK') && p.screenshot) {
          formData.append(`payment_${index}_screenshot`, p.screenshot);
        }
      });

      if (withInvoice && invoiceImage) {
        formData.append("invoice_image", invoiceImage);
      }

      await api.post("/api/order-container/create/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess();
    } catch (err: any) {
      console.error("Order creation error:", err);
      alert(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to create order"
      );
    } finally {
      setSubmitting(false);
    }
  };

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
    setItems,
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
    handleItemChange,
    handleTotalPaymentChange,
    handleAdvancePaymentChange,
    handleSubmit,
  };
}
