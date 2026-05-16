export function Panel({ title, children, className = '' }) {
  return <section className={`rounded-md border border-line bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}><h2 className="mb-3 text-base font-semibold">{title}</h2>{children}</section>
}

export function PageTitle({ title, action }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-slate-500">Labstore admin operations</p></div>{action && <button className="rounded-md border border-line px-3 py-2 text-sm dark:border-zinc-700">{action}</button>}</div>
}
