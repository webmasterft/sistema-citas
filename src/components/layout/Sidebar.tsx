"use client";

import Link from "next/link";
import { 
  Users, 
  Building2, 
  Stethoscope, 
  FileText, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Clock
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSearchParams } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building2, label: "Instituciones", href: "/?tab=institutions", roles: ["admin", "webmaster"] },
  { icon: Stethoscope, label: "Médicos", href: "/?tab=doctors", roles: ["admin", "webmaster"] },
  { icon: Users, label: "Pacientes", href: "/?tab=patients", roles: ["admin", "webmaster", "doctor"] },
  { icon: Clock, label: "Citas", href: "/?tab=appointments", roles: ["doctor", "admin", "webmaster"] },
  { icon: Settings, label: "Configuración", href: "/?tab=settings", roles: ["admin", "webmaster", "doctor"] },
];

export function Sidebar() {
  const { signOut, user, role } = useAuth();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  console.log("Sidebar Debug - User:", user?.email, "Role:", role);

  return (
    <aside className="w-full h-full bg-card p-6">
      <div className="flex flex-col h-full">
        <div className="mb-10 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">MedApp</span>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems
              .filter(item => !item.roles || (role && item.roles.includes(role)))
              .map((item) => {
                const isActive = (item.href === "/" && !searchParams.get("tab")) || 
                                 (item.href.includes(`tab=${activeTab}`));
              
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                      isActive 
                        ? "bg-primary/10 text-primary shadow-sm" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="pt-6 border-t mt-auto space-y-4">
          <div className="flex items-center gap-3 px-3 py-2">
             <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
               {user?.email?.[0].toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-xs font-bold truncate">{user?.email}</p>
             </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex cursor-pointer w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </button>
          <p className="text-[10px] text-muted-foreground text-center">Ecuador v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
