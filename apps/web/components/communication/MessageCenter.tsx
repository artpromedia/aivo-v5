'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, type Socket } from 'socket.io-client'
import { Video, Info, Paperclip, Send, Check, Sparkles, Bell, Phone } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ConversationSummary {
  id: string
  userId: string
  name: string
  role: string
  learnerId?: string
  learnerName?: string
  avatar?: string | null
  lastMessage: string
  lastMessageTime: string | Date
  unreadCount: number
}

interface MessagePayload {
  id: string
  content: string
  createdAt: string | Date
  from: string
  fromUser?: {
    id: string
    username: string
    role: string
  }
  to: string
  type: string
  learnerId?: string
  readAt?: string | Date | null
}

interface InsightPayload {
  id?: string
  summary: string
  recommendations: string[]
  priority?: string
}

interface AnnouncementPayload {
  id: string
  title: string
  content: string
  priority: string
  createdAt: string
}

interface NotificationPreferencePayload {
  channels: {
    email: boolean
    inApp: boolean
    sms?: boolean
  }
  digestFrequency: 'INSTANT' | 'DAILY' | 'WEEKLY'
  muteUntil?: string | null
}

interface CommunicationLogEntry {
  id: string
  type: string
  channel: string
  createdAt: string
  payload: Record<string, unknown>
}

interface MeetingFormState {
  participants: string
  topic: string
  scheduledTime: string
  duration: string
}

const socketPath = '/api/socket_io'

export function MessageCenter() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<MessagePayload[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [aiInsights, setAiInsights] = useState<InsightPayload[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [announcements, setAnnouncements] = useState<AnnouncementPayload[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferencePayload | null>(null)
  const [meetingForm, setMeetingForm] = useState<MeetingFormState>({
    participants: '',
    topic: '',
    scheduledTime: '',
    duration: ''
  })
  const [logs, setLogs] = useState<CommunicationLogEntry[]>([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const socketURL = useMemo(() => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_SOCKET_URL
    return process.env.NEXT_PUBLIC_SOCKET_URL ?? window.location.origin
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return

    const bootstrap = async () => {
      await fetch('/api/socket')
      const client = io(socketURL ?? window.location.origin, {
        path: socketPath,
        transports: ['websocket'],
        auth: { userId: session.user.id }
      })

      client.on('connect', () => {
        client.emit('authenticate', { userId: session.user.id })
      })

      client.on('newMessage', (message: MessagePayload) => {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
      })

      client.on('aiInsight', (insight: InsightPayload) => {
        setAiInsights((prev) => [insight, ...prev])
      })

      client.on('userTyping', ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
        if (userId !== session.user.id) {
          setIsTyping(typing)
        }
      })

      client.on('announcement', (announcement: AnnouncementPayload) => {
        setAnnouncements((prev) => [announcement, ...prev])
      })

      setSocket(client)
    }

    bootstrap()

    return () => {
      setSocket((prevSocket: Socket | null) => {
        prevSocket?.close()
        return null
      })
    }
  }, [session?.user?.id, socketURL])

  useEffect(() => {
    fetchConversations()
    fetchAnnouncements()
    fetchPreferences()
    fetchLogs()
  }, [])

  useEffect(() => {
    if (!selectedConversation) return
    fetch(`/api/communication/messages?withUser=${selectedConversation.userId}${selectedConversation.learnerId ? `&learnerId=${selectedConversation.learnerId}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages ?? [])
        scrollToBottom()
      })
  }, [selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    const res = await fetch('/api/communication/conversations')
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations ?? [])
    }
  }

  const fetchAnnouncements = async () => {
    const res = await fetch('/api/communication/announcements')
    if (res.ok) {
      const data = await res.json()
      setAnnouncements(data.announcements ?? [])
    }
  }

  const fetchPreferences = async () => {
    const res = await fetch('/api/communication/preferences')
    if (res.ok) {
      const data = await res.json()
      setPreferences(
        data.preference ?? {
          channels: { email: true, inApp: true },
          digestFrequency: 'INSTANT'
        }
      )
    }
  }

  const fetchLogs = async () => {
    const res = await fetch('/api/communication/logs')
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs ?? [])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !session?.user?.id) return

    const messageData = {
      from: session.user.id,
      to: selectedConversation.userId,
      message: newMessage,
      type: 'TEXT',
      learnerId: selectedConversation.learnerId
    }

    socket?.emit('sendMessage', messageData)
    await fetch('/api/communication/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: selectedConversation.userId,
        learnerId: selectedConversation.learnerId,
        message: newMessage,
        type: 'TEXT'
      })
    })

    setMessages((prev) => [
      ...prev,
      {
        ...messageData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        content: newMessage,
        fromUser: {
          id: session.user.id,
          username: session.user.name ?? session.user.username,
          role: session.user.role
        }
      }
    ])

    setNewMessage('')
    scrollToBottom()
  }

  const handleTyping = (typing: boolean) => {
    socket?.emit('typing', {
      to: selectedConversation?.userId,
      isTyping: typing
    })
  }

  const requestInsight = async () => {
    if (!selectedConversation?.learnerId) return
    socket?.emit('requestInsight', {
      learnerId: selectedConversation.learnerId,
      topic: 'general_progress',
      requesterId: session?.user?.id
    })
  }

  const scheduleMeeting = async () => {
    if (!meetingForm.participants || !meetingForm.topic || !meetingForm.scheduledTime) return
    setMeetingsLoading(true)
    await fetch('/api/communication/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participants: meetingForm.participants.split(',').map((p) => p.trim()),
        topic: meetingForm.topic,
        scheduledTime: meetingForm.scheduledTime,
        duration: meetingForm.duration ? Number(meetingForm.duration) : undefined
      })
    })
    setMeetingForm({ participants: '', topic: '', scheduledTime: '', duration: '' })
    setMeetingsLoading(false)
  }

  const savePreferences = async () => {
    if (!preferences) return
    await fetch('/api/communication/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex h-[650px] rounded-2xl bg-white shadow-lg overflow-hidden'>
        <aside className='w-80 border-r border-slate-200 flex flex-col'>
          <div className='p-4 border-b border-slate-200'>
            <h3 className='text-lg font-semibold'>Messages</h3>
            <p className='text-sm text-slate-500'>Secure parent/teacher threads</p>
          </div>
          <div className='flex-1 overflow-y-auto'>
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-slate-50',
                  selectedConversation?.id === conversation.id && 'bg-blue-50'
                )}
              >
                <Avatar name={conversation.name} src={conversation.avatar} size='md' />
                <div className='flex-1'>
                  <div className='flex items-center justify-between'>
                    <p className='font-medium'>{conversation.name}</p>
                    <span className='text-xs text-slate-500'>{formatTime(conversation.lastMessageTime)}</span>
                  </div>
                  <p className='text-xs text-slate-500'>{conversation.role}</p>
                  <p className='text-sm text-slate-600 truncate'>{conversation.lastMessage}</p>
                  {conversation.unreadCount > 0 && <Badge className='mt-1'>{conversation.unreadCount}</Badge>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className='flex-1 flex flex-col'>
          {selectedConversation ? (
            <>
              <header className='flex items-center justify-between border-b border-slate-200 p-4'>
                <div>
                  <p className='font-semibold'>{selectedConversation.name}</p>
                  <p className='text-xs text-slate-500'>{selectedConversation.role}</p>
                </div>
                <div className='flex gap-2'>
                  <button className='rounded-lg p-2 hover:bg-slate-100' onClick={requestInsight}>
                    <Sparkles className='h-5 w-5 text-theme-primary' />
                  </button>
                  <button className='rounded-lg p-2 hover:bg-slate-100'>
                    <Video className='h-5 w-5 text-slate-600' />
                  </button>
                  <button className='rounded-lg p-2 hover:bg-slate-100'>
                    <Info className='h-5 w-5 text-slate-600' />
                  </button>
                </div>
              </header>

              <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50'>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.from === session?.user?.id}
                    userName={message.fromUser?.username}
                  />
                ))}

                {aiInsights.map((insight) => (
                  <AIInsightCard key={insight.id ?? insight.summary} insight={insight} />
                ))}

                {isTyping && (
                  <div className='flex items-center gap-2 text-slate-500 text-sm'>
                    <span className='flex gap-1'>
                      <span className='h-2 w-2 animate-bounce rounded-full bg-slate-400' />
                      <span className='h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-100' />
                      <span className='h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-200' />
                    </span>
                    typing...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <footer className='border-t border-slate-200 p-4'>
                <div className='flex gap-2'>
                  <button className='rounded-lg p-2 hover:bg-slate-100'>
                    <Paperclip className='h-5 w-5 text-slate-600' />
                  </button>
                  <input
                    type='text'
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={() => handleTyping(true)}
                    onBlur={() => handleTyping(false)}
                    onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder='Type a message...'
                    className='flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50'
                  >
                    <Send className='h-4 w-4' /> Send
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className='flex flex-1 flex-col items-center justify-center text-slate-500'>
              Select a conversation to get started
            </div>
          )}
        </section>

        <aside className='w-80 border-l border-slate-200 flex flex-col gap-4 p-4 overflow-y-auto bg-slate-50'>
          <AnnouncementPanel announcements={announcements} />
          <NotificationPreferencesCard
            preferences={preferences}
            onChange={setPreferences}
            onSave={savePreferences}
          />
          <MeetingSchedulerCard
            form={meetingForm}
            onChange={setMeetingForm}
            onSubmit={scheduleMeeting}
            loading={meetingsLoading}
          />
          <ComplianceLogCard logs={logs} />
        </aside>
      </div>
    </div>
  )
}

function formatTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric' }).format(date)
}

function MessageBubble({ message, isOwn, userName }: { message: MessagePayload; isOwn: boolean; userName?: string }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%] space-y-1', isOwn ? 'text-right' : 'text-left')}>
        <p className='text-xs text-slate-500'>{!isOwn && userName}</p>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm',
            isOwn ? 'bg-blue-600 text-white ml-auto' : 'bg-white text-slate-900'
          )}
        >
          {message.content}
        </div>
        <div className='flex items-center justify-end gap-2 text-[11px] text-slate-500'>
          {formatTime(message.createdAt)}
          {isOwn && message.readAt && <Check className='h-3 w-3 text-blue-500' />}
        </div>
      </div>
    </div>
  )
}

function AIInsightCard({ insight }: { insight: InsightPayload }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className='rounded-xl border border-theme-primary/20 bg-gradient-to-r from-theme-primary/10 to-blue-50 p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-theme-primary to-blue-500 text-white'>
          <Sparkles className='h-4 w-4' />
        </div>
        <div className='flex-1 text-sm text-slate-700'>
          <p className='font-semibold text-theme-primary'>AI Insight</p>
          <p>{insight.summary}</p>
          {expanded && (
            <ul className='mt-3 space-y-1 text-xs text-slate-600'>
              {insight.recommendations.map((rec) => (
                <li key={rec}>• {rec}</li>
              ))}
            </ul>
          )}
          <button className='text-xs text-theme-primary' onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AnnouncementPanel({ announcements }: { announcements: AnnouncementPayload[] }) {
  return (
    <div className='rounded-2xl bg-white p-4 shadow-sm'>
      <div className='flex items-center gap-2 text-sm font-semibold text-slate-800'>
        <Bell className='h-4 w-4 text-amber-500' />
        Announcements
      </div>
      <div className='mt-3 space-y-3 text-sm'>
        {announcements.slice(0, 3).map((announcement) => (
          <div key={announcement.id} className='rounded-xl border border-slate-100 p-3'>
            <div className='flex items-center justify-between text-xs text-slate-500'>
              <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
              <Badge variant={announcement.priority === 'HIGH' ? 'default' : 'outline'}>{announcement.priority}</Badge>
            </div>
            <p className='mt-1 font-semibold text-slate-800'>{announcement.title}</p>
            <p className='text-xs text-slate-600'>{announcement.content}</p>
          </div>
        ))}
        {announcements.length === 0 && <p className='text-xs text-slate-500'>No announcements yet.</p>}
      </div>
    </div>
  )
}

function NotificationPreferencesCard({
  preferences,
  onChange,
  onSave
}: {
  preferences: NotificationPreferencePayload | null
  onChange: (pref: NotificationPreferencePayload) => void
  onSave: () => void
}) {
  if (!preferences) return null
  return (
    <div className='rounded-2xl bg-white p-4 shadow-sm space-y-3'>
      <div className='flex items-center gap-2 text-sm font-semibold text-slate-800'>
        <Bell className='h-4 w-4 text-blue-500' />
        Notification Preferences
      </div>
      <label className='flex items-center gap-2 text-sm'>
        <input
          type='checkbox'
          checked={preferences.channels.email}
          onChange={(e) => onChange({ ...preferences, channels: { ...preferences.channels, email: e.target.checked } })}
        />
        Email alerts
      </label>
      <label className='flex items-center gap-2 text-sm'>
        <input
          type='checkbox'
          checked={preferences.channels.inApp}
          onChange={(e) => onChange({ ...preferences, channels: { ...preferences.channels, inApp: e.target.checked } })}
        />
        In-app notifications
      </label>
      <select
        value={preferences.digestFrequency}
        onChange={(e) => onChange({ ...preferences, digestFrequency: e.target.value as NotificationPreferencePayload['digestFrequency'] })}
        className='w-full rounded-lg border border-slate-200 px-2 py-1 text-sm'
      >
        <option value='INSTANT'>Instant</option>
        <option value='DAILY'>Daily digest</option>
        <option value='WEEKLY'>Weekly summary</option>
      </select>
      <button
        onClick={onSave}
        className='w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white'
      >
        Save preferences
      </button>
    </div>
  )
}

function MeetingSchedulerCard({
  form,
  onChange,
  onSubmit,
  loading
}: {
  form: MeetingFormState
  onChange: (form: MeetingFormState) => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <div className='rounded-2xl bg-white p-4 shadow-sm space-y-3'>
      <div className='flex items-center gap-2 text-sm font-semibold text-slate-800'>
        <Phone className='h-4 w-4 text-green-500' />
        Video Call
      </div>
      <input
        type='text'
        placeholder='Participant IDs (comma separated)'
        value={form.participants}
        onChange={(e) => onChange({ ...form, participants: e.target.value })}
        className='w-full rounded-lg border border-slate-200 px-2 py-1 text-sm'
      />
      <input
        type='text'
        placeholder='Topic'
        value={form.topic}
        onChange={(e) => onChange({ ...form, topic: e.target.value })}
        className='w-full rounded-lg border border-slate-200 px-2 py-1 text-sm'
      />
      <input
        type='datetime-local'
        value={form.scheduledTime}
        onChange={(e) => onChange({ ...form, scheduledTime: e.target.value })}
        className='w-full rounded-lg border border-slate-200 px-2 py-1 text-sm'
      />
      <input
        type='number'
        placeholder='Duration (minutes)'
        value={form.duration}
        onChange={(e) => onChange({ ...form, duration: e.target.value })}
        className='w-full rounded-lg border border-slate-200 px-2 py-1 text-sm'
      />
      <button
        onClick={onSubmit}
        disabled={loading}
        className='w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white disabled:opacity-50'
      >
        Schedule call
      </button>
    </div>
  )
}

function ComplianceLogCard({ logs }: { logs: CommunicationLogEntry[] }) {
  return (
    <div className='rounded-2xl bg-white p-4 shadow-sm'>
      <p className='text-sm font-semibold text-slate-800'>Compliance Log</p>
      <div className='mt-3 space-y-2 max-h-48 overflow-y-auto text-xs text-slate-600'>
        {logs.slice(0, 6).map((log) => (
          <div key={log.id} className='rounded-lg border border-slate-100 p-2'>
            <div className='flex items-center justify-between'>
              <span className='font-semibold'>{log.type}</span>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className='mt-1 break-words text-[11px] text-slate-500'>
              Channel: {log.channel}
            </p>
          </div>
        ))}
        {logs.length === 0 && <p className='text-slate-500'>No communication logs recorded yet.</p>}
      </div>
    </div>
  )
}
