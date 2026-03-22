import React from 'react'

type Page = 'dashboard' | 'users'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  onLogout: () => void
  children: React.ReactNode
}

export default function Layout({ currentPage, onNavigate, onLogout, children }: LayoutProps) {
  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-[#1e293b] flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-lg font-bold text-accent">W</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">WikiTok</h1>
              <p className="text-slate-500 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#1e293b]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-[#111827] border-b border-[#1e293b] flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-white font-semibold">
            {currentPage === 'dashboard' ? 'Dashboard' : 'Users'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-sm font-bold">N</span>
            </div>
            <span className="text-slate-300 text-sm">noah@checkpointgtm.com</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
