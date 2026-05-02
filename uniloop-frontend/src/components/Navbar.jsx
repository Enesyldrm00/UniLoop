import { Home, MessageCircle, ClipboardList, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',         icon: Home,          label: 'Ana Sayfa' },
  { to: '/tasks',    icon: ClipboardList, label: 'İlanlar'   },
  { to: '/messages', icon: MessageCircle, label: 'Mesajlar'  },
  { to: '/profile',  icon: User,          label: 'Profil'    },
]

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe lg:hidden">
      <div className="bg-white border-t border-slate-200 shadow-sm">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all duration-200
                 ${isActive
                   ? 'text-slate-900'
                   : 'text-slate-400 hover:text-slate-600'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
