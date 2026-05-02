import { Home, ListChecks, Users, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',        icon: Home,       label: 'Ana Sayfa' },
  { to: '/tasks',   icon: ListChecks, label: 'İlanlar'   },
  { to: '/pools',   icon: Users,      label: 'Sepetler'  },
  { to: '/wallet',  icon: Wallet,     label: 'Cüzdan'    },
]

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe">
      <div className="glass-card rounded-none border-x-0 border-b-0 border-t border-white/[0.07]
                      bg-dark-card/90 backdrop-blur-2xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200
                 ${isActive
                   ? 'text-brand bg-brand/10'
                   : 'text-white/40 hover:text-white/70'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
