"use client";

import { useState, createContext, useContext, type ReactNode } from "react";

type TabsContextType = {
  activeTab: string;
  setActiveTab: (id: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within Tabs");
  return ctx;
}

export function Tabs({
  defaultTab,
  children,
}: {
  defaultTab: string;
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}

export function Tab({
  id,
  children,
  disabled = false,
}: {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${
        isActive
          ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
          : disabled
            ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function TabPanel({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { activeTab } = useTabs();
  if (activeTab !== id) return null;
  return <div className="mt-4">{children}</div>;
}
