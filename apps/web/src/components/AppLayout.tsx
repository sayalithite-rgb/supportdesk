import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getSessionUser, isAgent } from '../lib/role'
import { Icon, type IconName } from './Icon'

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = getSessionUser()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const items: { to: string; label: string; icon: IconName; active: boolean }[] = [
    { to: '/', label: 'Overview', icon: 'home', active: pathname === '/' },
    ...(isAgent(user.role)
      ? [{ to: '/my-work', label: 'My work', icon: 'ticket' as const, active: pathname === '/my-work' }]
      : []),
    {
      to: '/tickets',
      label: 'Tickets',
      icon: 'ticket',
      active: pathname.startsWith('/tickets') && pathname !== '/tickets/new',
    },
    { to: '/tickets/new', label: 'New ticket', icon: 'plus', active: pathname === '/tickets/new' },
  ]

  return (
    <div className="min-h-screen flex">
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-amz-navy text-white flex flex-col transform transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-[68px] border-b border-white/10">
          <span className="h-10 w-10 rounded-xl bg-amz-orange text-amz-navy font-bold flex items-center justify-center">
            SD
          </span>
          <div>
            <div className="font-bold leading-tight">
              support<span className="text-amz-orange">desk</span>
            </div>
            <div className="text-xs text-slate-300">Support workspace</div>
          </div>
        </div>

        <nav aria-label="Main" className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400">WORKSPACE</p>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              aria-current={item.active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amz-orange ${
                item.active
                  ? 'bg-amz-navy-light border-amz-orange font-bold'
                  : 'border-transparent text-slate-200 hover:bg-amz-navy-light'
              }`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="m-3 rounded-xl bg-amz-navy-light p-3">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="font-bold truncate">{user.name}</p>
          {user.email && <p className="text-xs text-slate-300 truncate">{user.email}</p>}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="text-white border-b-[3px] border-amz-orange"
          style={{ background: 'linear-gradient(90deg, #131921, #232f3e)' }}
        >
          <div className="h-[68px] px-4 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="lg:hidden p-2 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amz-orange"
              >
                <Icon name="menu" />
              </button>
              <div className="min-w-0">
                <p className="font-bold truncate">Support workspace</p>
                <p className="text-xs text-slate-300 truncate">Manage your support activity</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-sm leading-tight">{user.name}</p>
                <p className="text-[11px] tracking-wide uppercase text-slate-300">{user.role ?? 'User'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-1.5 rounded-lg border border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amz-orange"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}