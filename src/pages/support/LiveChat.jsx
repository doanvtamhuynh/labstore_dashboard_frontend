import * as signalR from '@microsoft/signalr'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FormInput } from '../../components/Fields'
import { PageTitle, Panel } from '../../components/Panel'
import { tokenStore } from '../../services/api'
import { API_ORIGIN } from '../../utils/data'

export function LiveChat() {
  const [ticketId, setTicketId] = useState('')
  const [sender, setSender] = useState(tokenStore.getUser()?.email || 'admin')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [connection, setConnection] = useState(null)

  useEffect(() => {
    const next = new signalR.HubConnectionBuilder().withUrl(`${API_ORIGIN}/hubs/chat`).withAutomaticReconnect().build()
    next.on('ticketMessageReceived', (payload) => setMessages((items) => [payload, ...items].slice(0, 30)))
    next.start().then(() => setConnection(next)).catch(() => {})
    return () => { next.stop() }
  }, [])

  async function join() {
    if (!ticketId || !connection) return
    await connection.invoke('JoinTicket', ticketId)
    toast.success('Joined ticket chat')
  }

  async function send() {
    if (!ticketId || !message || !connection) return
    await connection.invoke('SendTicketMessage', ticketId, sender, message)
    setMessage('')
  }

  return (
    <section>
      <PageTitle title="Live Chat" action={connection ? 'Connected' : 'Connecting'} />
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Panel title="Ticket Channel">
          <FormInput label="Ticket ID" value={ticketId} onChange={setTicketId} />
          <FormInput label="Sender" value={sender} onChange={setSender} />
          <button onClick={join} className="mt-3 w-full rounded-md bg-brand px-4 py-2 text-white">Join Ticket</button>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" className="mt-3 h-28 w-full rounded-md border border-line bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" />
          <button onClick={send} className="mt-3 w-full rounded-md border border-line px-4 py-2 dark:border-zinc-700">Send</button>
        </Panel>
        <Panel title="Messages">
          {messages.length === 0 ? <div className="py-10 text-center text-slate-500">No live messages yet</div> : messages.map((item, index) => (
            <div key={index} className="border-b border-line py-3 last:border-0 dark:border-zinc-800">
              <div className="text-sm font-medium">{item.sender}</div>
              <div className="text-sm text-slate-600 dark:text-zinc-300">{item.message}</div>
            </div>
          ))}
        </Panel>
      </div>
    </section>
  )
}
