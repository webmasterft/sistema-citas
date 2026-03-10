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
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Building2,
    label: "Instituciones",
    href: "/?tab=institutions",
    roles: ["admin", "webmaster"],
  },
  { icon: Stethoscope, label: "Médicos", href: "/?tab=doctors", roles: ["admin", "webmaster"] },
  {
    icon: Users,
    label: "Pacientes",
    href: "/?tab=patients",
    roles: ["admin", "webmaster", "doctor"],
  },
  {
    icon: Clock,
    label: "Citas",
    href: "/?tab=appointments",
    roles: ["doctor", "admin", "webmaster"],
  },
  {
    icon: Settings,
    label: "Configuración",
    href: "/?tab=configuracion",
    roles: ["admin", "webmaster", "doctor"],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { signOut, user, role, profile, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";

  return (
    <aside className="h-full flex flex-col bg-background p-6">
      <div className="flex items-center gap-3 mb-10 px-2 transition-transform hover:scale-105 duration-200">
        <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
          M
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">MedApp</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold -mt-1">
            Gestión Médica
          </span>
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1.5">
          {menuItems
            .filter((item) => !item.roles || (role && item.roles.includes(role)))
            .map((item) => {
              const isActive =
                (item.href === "/" && !searchParams.get("tab")) ||
                item.href.includes(`tab=${activeTab}`);

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 cursor-pointer group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-5 transition-transform group-hover:scale-110",
                        isActive ? "text-primary-foreground" : "text-slate-400"
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="mt-auto space-y-4">
        <div
          onClick={() => router.push("/?tab=configuracion")}
          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100 hover:shadow-sm cursor-pointer group"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="size-10 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="size-10 rounded-2xl bg-[#0F172A] flex items-center justify-center text-sm font-bold text-white shadow-sm">
              {(profile?.full_name?.split(" ")[0]?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-[#0F172A] truncate">
              {(() => {
                if (profile?.full_name) {
                  const parts = profile.full_name.split(" ");
                  if (parts.length >= 3) return `${parts[0]} ${parts[2]}`;
                  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
                  return parts[0];
                }
                return `Dr. ${user?.email?.split("@")[0]}`;
              })()}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">
              {profile?.specialty || "Médico Especialista"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="flex cursor-pointer w-full items-center justify-center gap-3 rounded-2xl bg-red-50 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-100 border-none shadow-sm hover:shadow-md"
        >
          <LogOut className="size-4" />
          Cerrar Sesión
        </button>

        <p className="text-[10px] text-slate-300 font-medium text-center tracking-widest uppercase">
          Ecuador v1.0.0
        </p>
      </div>
    </aside>
  );
}
