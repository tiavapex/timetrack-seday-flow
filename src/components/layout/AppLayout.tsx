import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          userName="Admin"
        />
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
