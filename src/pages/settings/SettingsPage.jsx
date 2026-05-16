import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormInput } from '../../components/Fields'
import { PageTitle, Panel } from '../../components/Panel'
import { api } from '../../services/api'

export function SettingsPage() {
  const store = useQuery({ queryKey: ['settings-store'], queryFn: () => api.get('/settings/store').then((r) => r.data.data) })
  const general = useQuery({ queryKey: ['settings-general'], queryFn: () => api.get('/settings/general').then((r) => r.data.data) })
  const [storeForm, setStoreForm] = useState({ storeName: '', logoUrl: '', address: '', timeZone: 'Asia/Saigon' })
  const [generalForm, setGeneralForm] = useState({ taxRate: 0, currency: 'VND', language: 'vi' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [backupResult, setBackupResult] = useState(null)
  const activeStore = store.data || storeForm
  const activeGeneral = general.data || generalForm

  async function saveStore() {
    try {
      await api.put('/settings/store', { ...activeStore, ...storeForm })
      toast.success('Store settings saved')
      store.refetch()
    } catch {
      toast.error('Store settings failed')
    }
  }

  async function saveGeneral() {
    try {
      await api.put('/settings/general', { ...activeGeneral, ...generalForm, taxRate: Number(generalForm.taxRate || activeGeneral.taxRate || 0) })
      toast.success('General settings saved')
      general.refetch()
    } catch {
      toast.error('General settings failed')
    }
  }

  async function backup() {
    try {
      const response = await api.post('/settings/backup')
      setBackupResult(response.data.data)
      toast.success('Backup completed')
    } catch {
      toast.error('Backup failed')
    }
  }

  async function changePassword() {
    try {
      await api.post('/auth/change-password', passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      toast.success('Password changed')
    } catch {
      toast.error('Password change failed')
    }
  }

  return (
    <section>
      <PageTitle title="Settings" action="System" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Store">
          <FormInput label="Store Name" value={storeForm.storeName || activeStore.storeName} onChange={(value) => setStoreForm({ ...storeForm, storeName: value })} />
          <FormInput label="Logo URL" value={storeForm.logoUrl || activeStore.logoUrl || ''} onChange={(value) => setStoreForm({ ...storeForm, logoUrl: value })} />
          <FormInput label="Address" value={storeForm.address || activeStore.address} onChange={(value) => setStoreForm({ ...storeForm, address: value })} />
          <FormInput label="Time Zone" value={storeForm.timeZone || activeStore.timeZone} onChange={(value) => setStoreForm({ ...storeForm, timeZone: value })} />
          <button onClick={saveStore} className="mt-4 rounded-md bg-brand px-4 py-2 text-white">Save Store</button>
        </Panel>
        <Panel title="General">
          <FormInput label="Tax Rate" type="number" value={generalForm.taxRate || activeGeneral.taxRate} onChange={(value) => setGeneralForm({ ...generalForm, taxRate: value })} />
          <FormInput label="Currency" value={generalForm.currency || activeGeneral.currency} onChange={(value) => setGeneralForm({ ...generalForm, currency: value })} />
          <FormInput label="Language" value={generalForm.language || activeGeneral.language} onChange={(value) => setGeneralForm({ ...generalForm, language: value })} />
          <div className="mt-4 flex gap-2">
            <button onClick={saveGeneral} className="rounded-md bg-brand px-4 py-2 text-white">Save General</button>
            <button onClick={backup} className="rounded-md border border-line px-4 py-2 dark:border-zinc-700">Backup</button>
          </div>
          {backupResult && <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600 dark:bg-zinc-950 dark:text-zinc-300"><div>Status: {backupResult.status}</div><div>Size: {Number(backupResult.sizeBytes || 0).toLocaleString()} bytes</div><div className="truncate">Path: {backupResult.filePath}</div></div>}
        </Panel>
        <Panel title="Security">
          <FormInput label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })} />
          <FormInput label="New Password" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })} />
          <button onClick={changePassword} className="mt-4 rounded-md bg-brand px-4 py-2 text-white">Change Password</button>
        </Panel>
      </div>
    </section>
  )
}
