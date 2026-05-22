"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { name: "Mule Network", href: "/dashboard/mule-graph", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> },
    { name: "India Heatmap", href: "/dashboard/heatmap", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { name: "Adversarial Sim", href: "/dashboard/adversarial", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r border-[var(--border-color)] glass-card m-4 flex flex-col">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center space-x-3">
          <Image src="/logo.png" alt="DRISHTI Logo" width={40} height={40} className="object-contain" priority />
          <div>
            <h1 className="text-base font-black tracking-tighter leading-none">
              <span className="glow-copper text-[var(--accent-copper)]">DRI</span>
              <span className="text-[var(--text-main)]">SHTI</span>
            </h1>
            <p className="text-[9px] text-[var(--accent-light)] font-mono tracking-widest mt-1">FRAUD OPS</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isActive 
                    ? "bg-[rgba(107,90,77,0.3)] text-[var(--text-main)] border-l-2 border-[var(--accent-copper)] shadow-[0_0_15px_rgba(184,115,51,0.1)]" 
                    : "text-[var(--accent-light)] hover:text-[var(--text-main)] hover:bg-[rgba(107,90,77,0.15)]"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile SaaS Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <Link href="/login" className="flex items-center p-2 rounded-lg hover:bg-[rgba(107,90,77,0.15)] transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-copper)] font-bold text-sm shadow-inner group-hover:border-[var(--accent-copper)] transition-colors">
              AA
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-[var(--text-main)] truncate">Anjali Analyst</p>
              <p className="text-xs text-[var(--accent-light)] truncate">L2 Investigator</p>
            </div>
            <svg className="w-4 h-4 text-[var(--accent-light)] group-hover:text-[var(--accent-copper)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </Link>
          
          <div className="mt-4 flex items-center justify-between text-xs font-mono text-[var(--accent-light)] px-2">
            <span>System Status</span>
            <span className="flex items-center text-[var(--risk-green)] font-bold">
              <span className="w-2 h-2 rounded-full bg-[var(--risk-green)] animate-pulse mr-2 shadow-[0_0_8px_rgba(125,140,108,0.6)]"></span>
              ONLINE
            </span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 pl-0 page-enter">
        {children}
      </main>
    </div>
  );
}
