import Link from "next/link";
import { 
  Users, 
  Building2, 
  Stethoscope, 
  FileText, 
  Settings, 
  LayoutDashboard 
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building2, label: "Instituciones", href: "/" },
  { icon: Stethoscope, label: "Médicos", href: "/" },
  { icon: Users, label: "Pacientes", href: "/" },
  { icon: FileText, label: "Historias Clínicas", href: "/" },
  { icon: Settings, label: "Configuración", href: "/" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card p-6 hidden lg:block">
      <div className="flex flex-col h-full">
        <div className="mb-10 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">MedApp</span>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="pt-6 border-t mt-auto">
          <p className="text-xs text-muted-foreground">Ecuador v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
