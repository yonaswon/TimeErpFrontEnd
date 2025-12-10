import { useState, useEffect } from "react";
import api from "@/api";
import { FormItem, Account } from "../types";

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

  // Payment fields
  const [withInvoice, setWithInvoice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);
  const [paymentNote, setPaymentNote] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Initialize items from selectedItems and set default delivery date
  useEffect(() => {
    const initItems: FormItem[] = selectedItems.map((item) => {
      const defaultDesignType = designTypes.length > 0 ? designTypes[0].id : 0;

      return {
        id: item.id,
        type: item.type,
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

    // Set default delivery date to 7 days from now
    // const defaultDeliveryDate = new Date();
    // defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 7);
    // setDeliveryDate(defaultDeliveryDate.toISOString().slice(0, 16));

    // Set location from lead data if available
    // if (leadData.note) {
    //   setLocation(leadData.note);
    // }
  }, [selectedItems, designTypes, leadData]);

  // Fetch accounts based on invoice selection
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accountType = withInvoice ? "P" : "C";
        const response = await api.get(
          `/finance/account/?account_type=${accountType}&deleted=false`
        );
        const accountsData = response.data.results || response.data;
        setAccounts(accountsData);
        setSelectedAccount(null);
      } catch (err) {
        console.error("Failed to fetch accounts", err);
        setAccounts([]);
      }
    };

    if (paymentMethod === "BANK" || paymentMethod === "CHECK") {
      fetchAccounts();
    } else {
      setAccounts([]);
      setSelectedAccount(null);
    }
  }, [withInvoice, paymentMethod]);

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

    const validationErrors = validateForm({
      items,
      designTypes,
      selectedWallet,
      paymentMethod,
      selectedAccount,
      paymentScreenshot,
      withInvoice,
      invoiceImage,
      location,
      deliveryDate,
    });

    if (validationErrors.length > 0) {
      alert("Please fix the following errors:\n" + validationErrors.join("\n"));
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
          mockup: item.type === "mockup" ? item.id : null,
          mockup_modification: item.type === "modification" ? item.id : null,
          price: price,
          note: item.note || "",
          boms_data: [], // Empty BOM data
        };
      });

      const formData = new FormData();

      // Append all basic fields
      const payload = {
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
        wallet: selectedWallet,
        method: paymentMethod,
        account: selectedAccount,
        payment_note: paymentNote,
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      formData.append("orders_data", JSON.stringify(ordersData));

      if (paymentMethod === "BANK" || paymentMethod === "CHECK") {
        if (paymentScreenshot) {
          formData.append("payment_screenshot", paymentScreenshot);
        }
      }

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
    paymentMethod,
    selectedAccount,
    selectedWallet,
    paymentScreenshot,
    invoiceImage,
    paymentNote,
    accounts,
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
    setPaymentMethod,
    setSelectedAccount,
    setSelectedWallet,
    setPaymentScreenshot,
    setInvoiceImage,
    setPaymentNote,
    setAccounts,

    // Handlers
    handleItemChange,
    handleTotalPaymentChange,
    handleAdvancePaymentChange,
    handleSubmit,
  };
}
