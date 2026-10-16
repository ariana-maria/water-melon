'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Leaf, Megaphone } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { href: '/career',   label: 'Career',    icon: Briefcase },
  { href: '/wellness', label: 'Wellness',  icon: Leaf },
  { href: '/content',  label: 'Content',   icon: Megaphone },
]

export default function Navigation() {
  const path = usePathname()

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 flex-col bg-wm-green text-white">
        <div className="px-6 py-7 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍉</span>
            <div>
              <p className="font-semibold text-sm leading-tight">Watermelon</p>
              <p className="text-xs text-white/50">2026 Command Center</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                path === href
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-5 border-t border-white/10">
          <p className="text-xs text-white/40">Ariana Brandão</p>
          <p className="text-xs text-white/25">Your year, your terms.</p>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-wm-green flex z-50">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors',
              path === href ? 'text-white' : 'text-white/50'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
