"use client";

import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { name: "Mule Network", href: "/mule-graph", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> },
    { name: "India Heatmap", href: "/heatmap", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { name: "Adversarial Sim", href: "/adversarial", icon: <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  ];

  return (
    <html lang="en">
      <head>
        <title>DRISHTI Dashboard</title>
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-mesh min-h-screen`}>
        <div className="flex h-screen overflow-hidden">
          <aside className="w-64 border-r border-[#1e293b] glass-card m-4 flex flex-col">
            <div className="p-6 border-b border-[#1e293b]">
              <h1 className="text-2xl font-black tracking-tighter">
                <span className="glow-cyan text-[#00d4ff]">DRI</span>
                <span className="text-white">SHTI</span>
              </h1>
              <p className="text-xs text-slate-400 mt-2 font-mono">LIVE FRAUD OPS</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive 
                        ? "bg-[#1e293b]/50 text-white border-l-2 border-[#00d4ff]" 
                        : "text-slate-400 hover:text-white hover:bg-[#1e293b]/30"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#1e293b]">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>System Status</span>
                <span className="flex items-center text-[#00f5a0]">
                  <span className="w-2 h-2 rounded-full bg-[#00f5a0] animate-pulse mr-2"></span>
                  ONLINE
                </span>
              </div>
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto p-4 pl-0 page-enter">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
