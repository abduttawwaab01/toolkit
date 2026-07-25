"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Users, Clock, Puzzle, Settings, ScrollText, Megaphone, FileText, CreditCard } from "lucide-react";
import { AdminOverview } from "@/components/admin/admin-overview";
import { AdminUsers } from "@/components/admin/admin-users";
import { AdminStorageConfig } from "@/components/admin/admin-storage-config";
import { AdminFeatures } from "@/components/admin/admin-features";
import { AdminPlatformSettings } from "@/components/admin/admin-platform-settings";
import { AdminAuditLog } from "@/components/admin/admin-audit-log";
import { AdminAnnouncements } from "@/components/admin/admin-announcements";
import { AdminDocuments } from "@/components/admin/admin-documents";
import { AdminCredits } from "@/components/admin/admin-credits";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "storage", label: "Storage & Files", icon: Clock },
  { id: "features", label: "Features", icon: Puzzle },
  { id: "platform", label: "Platform", icon: Settings },
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "credits", label: "Credits", icon: CreditCard },
] as const;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <AdminOverview />;
      case "users": return <AdminUsers />;
      case "storage": return <AdminStorageConfig />;
      case "features": return <AdminFeatures />;
      case "platform": return <AdminPlatformSettings />;
      case "audit": return <AdminAuditLog />;
      case "announcements": return <AdminAnnouncements />;
      case "documents": return <AdminDocuments />;
      case "credits": return <AdminCredits />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="section-padding max-width-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Admin Dashboard</h1>
          <p className="text-text-secondary">Full control over users, limits, features, and platform configuration.</p>
        </div>

        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-neon-cyan"
                  : "text-text-secondary hover:text-text-primary hover:bg-glass-medium"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="admin-tab"
                  className="absolute inset-0 glass rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
