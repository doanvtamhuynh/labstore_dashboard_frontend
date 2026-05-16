import { Boxes } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Field } from '../../components/Fields'
import { login } from '../../services/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@labstore.local', password: 'Admin@123456' })
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Login successful')
      navigate('/dashboard')
    } catch {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-ink dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.1fr_.9fr]">
        <section className="flex flex-col justify-center px-8 py-12">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-brand text-white"><Boxes /></div>
          <h1 className="text-4xl font-semibold">Labstore Dashboard</h1>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-zinc-400">Admin operations for catalog, orders, customers, marketing, support, reports, and settings.</p>
        </section>
        <section className="flex items-center px-8 py-12">
          <form onSubmit={submit} className="w-full rounded-md border border-line bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Sign in</h2>
            <Field label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
            <button disabled={loading} className="mt-5 w-full rounded-md bg-brand px-4 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-60">{loading ? 'Signing in...' : 'Login'}</button>
          </form>
        </section>
      </div>
    </main>
  )
}
