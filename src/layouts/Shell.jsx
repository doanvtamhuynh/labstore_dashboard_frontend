import * as signalR from '@microsoft/signalr'
import { Bell, Boxes, ChevronLeft, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { nav } from '../config/navigation'
import { RoutesContent } from '../pages/RoutesContent'
import { queryClient } from '../queryClient'
import { api, tokenStore } from '../services/api'
import { API_ORIGIN, pickRows } from '../utils/data'

export function Shell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [liveNotifications, setLiveNotifications] = useState([])
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const navigate = useNavigate()
  const user = tokenStore.getUser()
  const notifications = useQuery({ queryKey: ['header-notifications'], queryFn: () => api.get('/notifications').then((r) => pickRows(r.data)), refetchInterval: 60000 })

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder().withUrl(`${API_ORIGIN}/hubs/notifications`).withAutomaticReconnect().build()
    connection.on('notificationReceived', (message) => {
      setLiveNotifications((items) => [message, ...items].slice(0, 5))
      toast.info(message.title)
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['/notifications'] })
    })
    connection.start().then(() => connection.invoke('JoinAdminChannel')).catch(() => {})
    return () => { connection.stop() }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const unread = [...liveNotifications, ...(notifications.data || [])].filter((item) => !item.isRead).length
  const filteredNav = nav.filter(([label]) => user?.role === 'SuperAdmin' || !['Admins', 'Audit Log'].includes(label))
  const sidebarLinks = (
    <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-3">
      {filteredNav.map(([label, to, Icon]) => (
        <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-teal-50 text-brand dark:bg-teal-950' : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>
          <Icon size={18} /> {!collapsed && label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex min-h-screen bg-slate-100 text-ink dark:bg-zinc-950 dark:text-zinc-100">
        <aside className={`${collapsed ? 'w-20' : 'w-72'} hidden border-r border-line bg-white transition-all dark:border-zinc-800 dark:bg-zinc-900 lg:block`}>
          <div className="flex h-16 items-center justify-between border-b border-line px-4 dark:border-zinc-800">
            <div className="flex items-center gap-3 font-semibold"><Boxes className="text-brand" /> {!collapsed && 'Labstore'}</div>
            <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft className={collapsed ? 'rotate-180' : ''} size={18} /></button>
          </div>
          {sidebarLinks}
        </aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button aria-label="Close navigation" className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-80 max-w-[86vw] border-r border-line bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-16 items-center justify-between border-b border-line px-4 dark:border-zinc-800">
                <div className="flex items-center gap-3 font-semibold"><Boxes className="text-brand" /> Labstore</div>
                <button onClick={() => setMobileOpen(false)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft size={18} /></button>
              </div>
              {sidebarLinks}
            </aside>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden"><Menu size={18} /></button><Search size={18} /><span className="text-sm text-slate-500">Search operations</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDark(!dark)} className="rounded-md border border-line p-2 dark:border-zinc-700">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
              <div className="relative">
                <button onClick={() => setNotifyOpen(!notifyOpen)} className="relative rounded-md border border-line p-2 dark:border-zinc-700">
                  <Bell size={18} />
                  {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[10px] text-white">{unread}</span>}
                </button>
                {notifyOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-md border border-line bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-2 text-sm font-semibold">Notifications</div>
                    {[...liveNotifications, ...(notifications.data || [])].slice(0, 6).map((item, index) => (
                      <div key={item.id || index} className="border-t border-line py-2 text-sm first:border-t-0 dark:border-zinc-800">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-slate-500">{item.message}</div>
                      </div>
                    ))}
                    <NavLink to="/notifications" onClick={() => setNotifyOpen(false)} className="mt-2 block rounded-md bg-slate-100 px-3 py-2 text-center text-sm dark:bg-zinc-800">View all</NavLink>
                  </div>
                )}
              </div>
              <span className="hidden text-sm sm:inline">{user?.fullName || user?.email}</span>
              <button onClick={() => { tokenStore.clear(); navigate('/login') }} className="rounded-md border border-line p-2 text-berry dark:border-zinc-700"><LogOut size={18} /></button>
            </div>
          </header>
          <main className="p-4 lg:p-6"><RoutesContent /></main>
        </div>
      </div>
    </div>
  )
}
