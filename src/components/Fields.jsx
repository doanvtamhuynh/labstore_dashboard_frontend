export function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="mt-4 block text-sm font-medium">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950" />
    </label>
  )
}

export function FormInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm font-medium">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
    </label>
  )
}
