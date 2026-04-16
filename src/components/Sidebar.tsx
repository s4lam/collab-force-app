"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  LogOut,
  Shield,
  Menu,
  X,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
];

const adminLinks = [
  { href: "/audit", label: "Audit Log", icon: FileText },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    let keyBuffer = "";
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret code tracking
      if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 6) keyBuffer = keyBuffer.slice(1);
      } else {
        keyBuffer = "";
      }

      if (keyBuffer === "collab" || (e.shiftKey && e.key.toLowerCase() === "h")) {
        triggerEasterEgg();
        keyBuffer = "";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerEasterEgg = () => {
    if (easterEggActive) return;
    setEasterEggActive(true);
  };

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      triggerEasterEgg();
      setLogoClicks(0);
    }
  };

  if (!session) return null;

  const isAdmin = session.user?.role === "ADMIN";

  return (
    <>
      <button
        className="fixed top-4 left-4 z-40 p-2 rounded-lg border border-surface-200 bg-white text-surface-700 shadow-sm lg:hidden hover:bg-surface-50 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-surface-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Styled Solid Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 shrink-0 z-40 flex flex-col bg-white border-r border-surface-200 transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div 
          className="p-6 pb-5 cursor-pointer group select-none relative" 
          onClick={handleLogoClick}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Shield size={18} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-surface-900 tracking-tight">Collab Force</h1>
              <p className="text-[11px] text-surface-500 font-medium tracking-wide">HEALTH SYSTEM</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">
            Overview
          </p>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors duration-150
                  ${active 
                    ? "bg-brand-50 text-brand-700 font-semibold" 
                    : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                  }`}
              >
                <Icon size={18} className={active ? "text-brand-600" : "text-surface-400"} />
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <p className="px-3 pt-8 pb-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">
                Administration
              </p>
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors duration-150
                      ${active 
                        ? "bg-surface-100 text-surface-900 font-semibold" 
                        : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                      }`}
                  >
                    <Icon size={18} className={active ? "text-surface-700" : "text-surface-400"} />
                    {link.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-surface-100 bg-surface-50/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-white border border-surface-200 flex items-center justify-center text-surface-700 text-xs font-bold shadow-sm">
              {session.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 truncate">{session.user?.name}</p>
              <p className="text-[11px] text-surface-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-surface-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Immersive Easter Egg */}
      {easterEggActive && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-md animate-fade-in" onClick={() => setEasterEggActive(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-10 m-4 animate-spring-up overflow-hidden">
            {/* Animated ECG background layer */}
            <div className="absolute inset-x-0 bottom-10 opacity-10 pointer-events-none">
              <svg viewBox="0 0 500 100" className="w-full h-32 stroke-brand-500 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 0,50 L 100,50 L 120,40 L 140,80 L 170,-20 L 200,90 L 220,10 L 250,50 L 500,50" className="path-draw" />
              </svg>
            </div>
            
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-brand-50 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-sm border border-brand-100">
                <Shield size={32} className="text-brand-600 animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight mb-2">Collab Force Origins</h2>
              <p className="text-[10px] text-surface-400 font-bold tracking-[0.2em] mb-10 border-b border-surface-100 pb-4 inline-block">ENGINEERED WITH PRECISION</p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {["Harry Waddimba", "Jack Sharpe", "Khilesh Raudhay", "Patrik Feraru", "Shaquil Nourrice"].map((name) => {
                  const initials = name.split(" ").map(n => n[0]).join("");
                  return (
                    <div key={name} className="flex items-center gap-3 bg-surface-50 border border-surface-200 rounded-full pr-5 pl-2 py-2 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                        {initials}
                      </div>
                      <span className="text-sm font-semibold text-surface-800">{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={() => setEasterEggActive(false)}
              className="absolute top-6 right-6 p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
