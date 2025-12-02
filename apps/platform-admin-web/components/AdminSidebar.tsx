"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Globe,
  Shield,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tenants", icon: Building2, label: "Tenants" },
  { href: "/users", icon: Users, label: "Users", disabled: true },
  { href: "/analytics", icon: BarChart3, label: "Analytics", disabled: true },
  { href: "/data-residency", icon: Globe, label: "Data Residency", disabled: true },
  { href: "/governance", icon: Shield, label: "Governance", disabled: true },
  { href: "/settings", icon: Settings, label: "Settings", disabled: true },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <p className="font-bold text-slate-900">AIVO</p>
            <p className="text-xs text-slate-500">Platform Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <li key={item.href}>
                  <span
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? "bg-violet-100 text-violet-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-violet-600" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-violet-50 to-lavender-50 rounded-xl p-4">
          <p className="text-xs font-medium text-violet-700 mb-1">Platform Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[11px] text-slate-600">All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
