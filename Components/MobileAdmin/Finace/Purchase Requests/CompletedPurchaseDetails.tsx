"use client";

import React, { useState } from "react";
import { Purchase } from "@/types/purchase";
import {
  X,
  Download,
  ExternalLink,
  Banknote,
  User,
  Calendar,
  Building,
  CreditCard,
  FileText,
  CheckCircle,
  Package,
  AlertCircle,
  Eye,
  Image as ImageIcon,
} from "lucide-react";

interface CompletedPurchaseDetailsProps {
  purchase: Purchase;
  onClose: () => void;
  onRefresh?: () => void;
}

const CompletedPurchaseDetails: React.FC<CompletedPurchaseDetailsProps> = ({
  purchase,
  onClose,
  onRefresh,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [viewingPaymentImage, setViewingPaymentImage] = useState(false);
  const [viewingInvoiceImage, setViewingInvoiceImage] = useState(false);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleDownloadInvoice = async () => {
    if (!purchase.invoice_image) return;

    try {
      setDownloading(true);
      const response = await fetch(purchase.invoice_image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${purchase.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "D":
        return {
          text: "Completed",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          icon: CheckCircle,
        };
      case "P":
        return {
          text: "Pending",
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          icon: AlertCircle,
        };
      case "C":
        return {
          text: "Confirmed",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          icon: CheckCircle,
        };
      default:
        return {
          text: status,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-900/30",
          icon: FileText,
        };
    }
  };

  const statusInfo = getStatusInfo(purchase.status);

  // Image viewer component
  const ImageViewer = ({
    imageUrl,
    title,
    onClose,
  }: {
    imageUrl: string;
    title: string;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-4">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
        </div>
        <div className="bg-black rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
        <div className="mt-4 flex justify-center gap-3">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = imageUrl;
              a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${
                purchase.id
              }.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Payment Image Viewer */}
      {viewingPaymentImage && purchase.payment_screenshot && (
        <ImageViewer
          imageUrl={purchase.payment_screenshot}
          title="Payment Screenshot"
          onClose={() => setViewingPaymentImage(false)}
        />
      )}

      {/* Invoice Image Viewer */}
      {viewingInvoiceImage && purchase.invoice_image && (
        <ImageViewer
          imageUrl={purchase.invoice_image}
          title="Invoice"
          onClose={() => setViewingInvoiceImage(false)}
        />
      )}

      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl transform rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-2xl transition-all">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-4 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                <statusInfo.icon className={`w-6 h-6 ${statusInfo.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Purchase #{purchase.id} Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(purchase.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Purchase Info */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status
                      </p>
                      <p
                        className={`text-lg font-semibold ${statusInfo.color}`}
                      >
                        {statusInfo.text}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                    >
                      {purchase.status}
                    </span>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Banknote className="w-5 h-5" />
                    Financial Information
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Amount
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(purchase.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment Method
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {purchase.from_wallet === "A"
                          ? "Account Transfer"
                          : "Wallet"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* From Account */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    From Account
                  </h4>
                  <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Bank
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {purchase.from_account.bank}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Account Number
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {purchase.from_account.account_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Account Holder
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {purchase.from_account.account_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* To Account */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    To Account
                  </h4>
                  <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Account Number
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {purchase.to_account_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        Account Name
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {purchase.to_account_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Materials and Documents */}
              <div className="space-y-6">
                {/* Materials Purchased */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Materials Purchased (
                    {purchase.each_material_purchase.length})
                  </h4>
                  <div className="space-y-3">
                    {purchase.each_material_purchase.map((materialPurchase) => (
                      <div
                        key={materialPurchase.id}
                        className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-semibold text-gray-900 dark:text-white">
                              {materialPurchase.material.name}
                            </h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Code: {materialPurchase.material.code_name}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(materialPurchase.total_price)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Amount
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {materialPurchase.amount} units
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Unit Price
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(materialPurchase.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Type
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {materialPurchase.material.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents & Images
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Invoice Image */}
                    {purchase.invoice && purchase.invoice_image && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Invoice
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Available
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingInvoiceImage(true)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Invoice
                        </button>
                      </div>
                    )}

                    {/* Payment Screenshot Image */}
                    {purchase.payment_screenshot && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Payment Proof
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Screenshot
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingPaymentImage(true)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Screenshot
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Created By */}
                <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created By
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        @{purchase.created_by.telegram_user_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {purchase.created_by.role
                          ?.map((r) => r.Name)
                          .join(", ") || "No role assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmed By */}
                {purchase.confirmed_by &&
                  typeof purchase.confirmed_by === "object" && (
                    <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Confirmed By
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            @{(purchase.confirmed_by as any).telegram_user_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {(purchase.confirmed_by as any).role
                              ?.map((r: any) => r.Name)
                              .join(", ") || "No role assigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-4 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
              {onRefresh && (
                <button
                  onClick={() => {
                    onRefresh();
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh List
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedPurchaseDetails;
