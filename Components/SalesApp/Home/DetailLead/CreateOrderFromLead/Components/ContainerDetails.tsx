"use client";

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
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
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
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
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
            type="number"
            value={totalPayment}
            min={0}
            step="1"
            onChange={(e) =>
              onTotalPaymentChange(parseFloat(e.target.value) || 0)
            }
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Advance Payment *
          </label>
          <input
            type="number"
            value={advancePayment}
            min={0}
            step="0.001"
            onChange={(e) =>
              onAdvancePaymentChange(parseFloat(e.target.value) || 0)
            }
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Remaining Payment
          </label>
          <input
            type="number"
            value={remainingPayment}
            readOnly
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-gray-100 dark:bg-zinc-600"
          />
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
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
          >
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
            className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
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
            onChange={(e) => onInstallationServiceChange(e.target.checked)}
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
            onChange={(e) => onDeliveryServiceChange(e.target.checked)}
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
          className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700"
          rows={3}
          placeholder="Add any notes for the entire order container..."
        />
      </div>
    </div>
  );
}
