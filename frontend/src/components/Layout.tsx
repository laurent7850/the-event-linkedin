import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/posts', label: 'Posts', icon: FileText },
  { to: '/settings', label: 'Paramètres', icon: Settings },
]

export default function Layout({ user, onLogout, children }: { user: any; onLogout: () => void; children: React.ReactNode }) {
  const loc = useLocation()
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold">The Event</h1>
          <p className="text-sm text-brand-100 opacity-70">LinkedIn CRM</p>
        </div>
        <nav className="flex-1 px-3">
          {nav.map(n => (
            <Link key={n.to} to={n.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${loc.pathname === n.to ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"}`}>
              <n.icon size={20} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-white/70 mb-2">{user.email}</div>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm text-white/50 hover:text-white">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
