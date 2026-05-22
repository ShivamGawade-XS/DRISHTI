import Link from "next/link";
import Image from "next/image";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans">
      {/* Horizontal Navbar */}
      <header className="w-full border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer">
              <Image src="/logo.png" alt="DRISHTI Logo" width={36} height={36} className="rounded-lg shadow-sm border border-[var(--accent-copper)]" />
              <span className="text-2xl font-black tracking-tighter text-[var(--text-main)]">
                DRI<span className="text-[var(--accent-copper)]">SHTI</span>
              </span>
            </div>
            
            {/* Nav Links */}
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-sm font-medium text-[var(--accent-light)] hover:text-[var(--text-main)] transition-colors">Features</Link>
              <Link href="#solutions" className="text-sm font-medium text-[var(--accent-light)] hover:text-[var(--text-main)] transition-colors">Solutions</Link>
              <Link href="#pricing" className="text-sm font-medium text-[var(--accent-light)] hover:text-[var(--text-main)] transition-colors">Pricing</Link>
              <Link href="#resources" className="text-sm font-medium text-[var(--accent-light)] hover:text-[var(--text-main)] transition-colors">Resources</Link>
            </nav>
            
            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-sm font-bold text-[var(--text-main)] hover:text-[var(--accent-copper)] transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-bold bg-[var(--accent-copper)] text-black px-5 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-md">
                Request Demo
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Standard Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[#1e1c1b] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-xl font-black tracking-tighter text-[var(--accent-light)]">
              DRI<span className="text-[var(--border-color)]">SHTI</span>
            </span>
            <span className="text-xs text-[var(--border-color)]">© 2026</span>
          </div>
          <div className="flex space-x-6 text-sm text-[var(--accent-light)]">
            <Link href="#" className="hover:text-[var(--text-main)]">Privacy Policy</Link>
            <Link href="#" className="hover:text-[var(--text-main)]">Terms of Service</Link>
            <Link href="#" className="hover:text-[var(--text-main)]">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
