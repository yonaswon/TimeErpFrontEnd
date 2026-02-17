"use client";
import { useState, useEffect } from "react";

interface ContainerDetailsProps {
  totalPayment: number;
  advancePayment: number;
  remainingPayment: number;
  containerNote: string;
  specialRequirement: string;
  orderDifficulty: string;
  location: string;
  deliveryDate: string;
  installationService: boolean;
  deliveryService: boolean;
  onTotalPaymentChange: (value: number) => void;
  onAdvancePaymentChange: (value: number) => void;
  onContainerNoteChange: (value: string) => void;
  onSpecialRequirementChange: (value: string) => void;
  onOrderDifficultyChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDeliveryDateChange: (value: string) => void;
  onInstallationServiceChange: (value: boolean) => void;
  onDeliveryServiceChange: (value: boolean) => void;
}

export default function ContainerDetails({
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
  onTotalPaymentChange,
  onAdvancePaymentChange,
  onContainerNoteChange,
  onSpecialRequirementChange,
  onOrderDifficultyChange,
  onLocationChange,
  onDeliveryDateChange,
  onInstallationServiceChange,
  onDeliveryServiceChange,
}: ContainerDetailsProps) {
  const [totalPaymentDisplay, setTotalPaymentDisplay] = useState("");
  const [advancePaymentDisplay, setAdvancePaymentDisplay] = useState("");
  const [remainingPaymentDisplay, setRemainingPaymentDisplay] = useState("");

  const handleInstallationChange = (checked: boolean) => {
    onInstallationServiceChange(checked);
    // If installation is selected, delivery must be selected
    if (checked) {
      onDeliveryServiceChange(true);
    }
  };

  const handleDeliveryChange = (checked: boolean) => {
    onDeliveryServiceChange(checked);
    // If delivery is deselected, installation must be deselected
    if (!checked) {
      onInstallationServiceChange(false);
    }
  };

  // Format number with commas
  const formatNumberWithCommas = (num: number): string => {
    if (num === 0) return "0";
    return num.toLocaleString("en-US");
  };

  // Parse comma-separated string to number
  const parseCommaSeparatedNumber = (str: string): number => {
    const cleaned = str.replace(/,/g, "");
    return parseFloat(cleaned) || 0;
  };

  // Initialize display values
  useEffect(() => {
    setTotalPaymentDisplay(formatNumberWithCommas(totalPayment));
    setAdvancePaymentDisplay(formatNumberWithCommas(advancePayment));
    setRemainingPaymentDisplay(formatNumberWithCommas(remainingPayment));
  }, [totalPayment, advancePayment, remainingPayment]);

  const handleTotalPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only numbers and commas
    if (value === "" || /^[0-9,]*$/.test(value)) {
      setTotalPaymentDisplay(value);

      // Parse the value when user stops typing (on blur) or when needed for calculation
      const parsedValue = parseCommaSeparatedNumber(value);
      onTotalPaymentChange(parsedValue);
    }
  };

  const handleAdvancePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    // Allow only numbers and commas
    if (value === "" || /^[0-9,]*$/.test(value)) {
      setAdvancePaymentDisplay(value);

      // Parse the value when user stops typing (on blur) or when needed for calculation
      const parsedValue = parseCommaSeparatedNumber(value);
      onAdvancePaymentChange(parsedValue);
    }
  };

  // Format input on blur
  const handleBlur = (type: "total" | "advance") => {
    if (type === "total") {
      const parsed = parseCommaSeparatedNumber(totalPaymentDisplay);
      setTotalPaymentDisplay(formatNumberWithCommas(parsed));
    } else if (type === "advance") {
      const parsed = parseCommaSeparatedNumber(advancePaymentDisplay);
      setAdvancePaymentDisplay(formatNumberWithCommas(parsed));
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Order Container Details
      </h3>

      {/* Location and Delivery Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Location *
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            placeholder="Delivery location"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Delivery Date *
          </label>
          <input
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => onDeliveryDateChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            required
          />
        </div>
      </div>

      {/* Payment Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Payment *
          </label>
          <input
            type="text"
            value={totalPaymentDisplay}
            onChange={handleTotalPaymentChange}
            onBlur={() => handleBlur("total")}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            placeholder="0"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Actual: {formatNumberWithCommas(totalPayment)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Advance Payment *
          </label>
          <input
            type="text"
            value={advancePaymentDisplay}
            onChange={handleAdvancePaymentChange}
            onBlur={() => handleBlur("advance")}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            placeholder="0"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Actual: {formatNumberWithCommas(advancePayment)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Remaining Payment
          </label>
          <input
            type="text"
            value={remainingPaymentDisplay}
            value={remainingPaymentDisplay}
            readOnly
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-gray-100 dark:bg-zinc-600 text-gray-900 dark:text-white"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Calculated automatically</p>
        </div>
      </div>

      {/* Order Difficulty and Special Requirement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Order Difficulty *
          </label>
          <select
            value={orderDifficulty}
            onChange={(e) => onOrderDifficultyChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
          >
            <option value="">Select difficulty</option>
            <option value="SIMPLE">Simple</option>
            <option value="MEDIUM">Medium</option>
            <option value="DIFFICULT">Difficult</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Special Requirement
          </label>
          <input
            type="text"
            value={specialRequirement}
            onChange={(e) => onSpecialRequirementChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            placeholder="Any special requirements..."
          />
        </div>
      </div>

      {/* Service Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="installationService"
            checked={installationService}
            onChange={(e) => handleInstallationChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="installationService"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Installation Service
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="deliveryService"
            checked={deliveryService}
            onChange={(e) => handleDeliveryChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="deliveryService"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Delivery Service
          </label>
        </div>
      </div>

      {/* Container Note */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Container Note
        </label>
        <textarea
          value={containerNote}
          onChange={(e) => onContainerNoteChange(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
          rows={3}
          placeholder="Add any notes for the entire order container..."
        />
      </div>
    </div>
  );
}
