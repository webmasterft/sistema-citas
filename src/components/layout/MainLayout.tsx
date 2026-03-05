"use client";

import { Sidebar } from "./Sidebar";
import { useState, useEffect } from "react";
import { Menu, X, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { session, signOut, loading, user } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering auth-dependent UI on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === "/login";

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="fixed top-0 z-40 flex w-full items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">MedApp</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => signOut()}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="size-5" />
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            className="rounded-md p-2 hover:bg-accent cursor-pointer"
          >
            {isSidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Backdrop - Mobile only */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Component */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform lg:z-30 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="min-h-screen pt-16 lg:pl-64 lg:pt-0">
        <div className="container mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
