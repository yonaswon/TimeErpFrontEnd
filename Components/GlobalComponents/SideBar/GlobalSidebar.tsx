"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export const GlobalSidebar = () => {
  const { isOpen, content, title, closeSidebar } = useSidebar();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeSidebar]);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      // Start open animation
      setShouldRender(true);
      setTimeout(() => {
        setIsAnimating(true);
      }, 10); // Small delay to trigger CSS transition
    } else {
      // Start close animation
      setIsAnimating(false);
      setTimeout(() => {
        setShouldRender(false);
      }, 300); // Wait for animation to complete
    }
  }, [isOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-full transform transition-transform duration-300 ease-out ${
          isAnimating ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-white dark:bg-zinc-900 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">{content}</div>
          </div>
        </div>
      </div>
    </>
  );
};
