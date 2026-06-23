'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Facebook,
  Video,
  Layers,
  Calendar,
  ListTodo,
  BarChart3,
  MousePointerClick,
  Settings,
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Facebook Pages',
    href: '/pages',
    icon: Facebook,
  },
  {
    title: 'Videos',
    href: '/videos',
    icon: Video,
  },
  {
    title: 'Variants',
    href: '/variants',
    icon: Layers,
  },
  {
    title: 'Scheduler',
    href: '/scheduler',
    icon: Calendar,
  },
  {
    title: 'Publish Tasks',
    href: '/tasks',
    icon: ListTodo,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Click Logs',
    href: '/clicks',
    icon: MousePointerClick,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Video className="h-6 w-6" />
            <span className="text-lg font-bold">Drama CPS</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Drama CPS Tracker v1.0
          </p>
        </div>
      </div>
    </aside>
  )
}