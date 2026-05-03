import { useState, useEffect } from 'react'
import {
  ArrowLeft, Send, Loader, MessageCircle, Inbox,
  User, Clock,
} from 'lucide-react'
import api from '../api/axios'
import Navbar from '../components/Navbar'

// ── Sohbet Ekranı ───────────────────────────────────────────
function ChatScreen({ conversation, myId, onBack }) {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)

  const otherId   = conversation.sender_id === myId
    ? conversation.receiver_id
    : conversation.sender_id
  const otherName = conversation.other_user_name

  useEffect(() => {
    api.get(`/messages/${otherId}`)
      .then(res => setMessages(res.data.messages || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [otherId])

  const sendMsg = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await api.post('/messages', {
        receiver_id:  otherId,
        message_text: text.trim(),
      })
      setMessages(prev => [...prev, res.data.message])
      setText('')
    } catch (err) {
      alert(err.response?.data?.message || 'Mesaj gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-container flex flex-col relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/[0.07]">
        <button onClick={onBack} className="w-9 h-9 glass-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center font-bold">
          {otherName?.[0]}
        </div>
        <div>
          <p className="text-sm font-semibold">{otherName}</p>
          <p className="text-[10px] text-white/40">Aktif</p>
        </div>
      </div>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: '80px' }}>
        {loading ? (
          <div className="flex justify-center pt-10">
            <Loader size={24} className="animate-spin text-white/30" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-white/30 text-sm pt-10">Henüz mesaj yok. İlk mesajı sen gönder!</p>
        ) : messages.map((msg) => {
          const isMe = msg.sender_id === myId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${isMe
                  ? 'bg-brand-gradient text-white rounded-br-sm'
                  : 'glass-card text-white/90 rounded-bl-sm'
                }`}>
                <p>{msg.message_text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-white/30'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="absolute bottom-20 inset-x-4 z-40">
        <div className="glass-card flex items-center gap-2 p-1.5 rounded-full shadow-2xl border border-white/10 bg-[#25304a]/80 backdrop-blur-md">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            placeholder="Mesaj yaz..."
            className="flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-slate-400"
          />
          <button
            onClick={sendMsg}
            disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-full bg-teal-500 text-teal-950 flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-400 transition-colors flex-shrink-0"
          >
            {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} className="-ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ana Mesajlar Sayfası ─────────────────────────────────────
export default function MessagesPage() {
  const [inbox,   setInbox]   = useState([])
  const [loading, setLoading] = useState(true)
  const [myId,    setMyId]    = useState(null)
  const [activeConv, setActiveConv] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/wallet/me'),
      api.get('/messages/inbox'),
    ]).then(([walletRes, inboxRes]) => {
      setMyId(walletRes.data.user?.id)
      setInbox(inboxRes.data.conversations || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (activeConv) {
    return (
      <ChatScreen
        conversation={activeConv}
        myId={myId}
        onBack={() => setActiveConv(null)}
      />
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <MessageCircle size={22} className="text-brand-light" />
        <h1 className="text-xl font-bold">Mesajlar</h1>
        {inbox.length > 0 && (
          <span className="ml-auto text-xs text-white/40">{inbox.length} sohbet</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center pt-20">
          <Loader size={28} className="animate-spin text-white/30" />
        </div>
      ) : inbox.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 px-6 text-center">
          <Inbox size={48} className="text-white/10 mb-4" />
          <p className="text-white/30 text-sm">Henüz hiç mesajın yok.</p>
          <p className="text-white/20 text-xs mt-1">Bir ilandan iletişim kur!</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {inbox.map((conv) => (
            <button
              key={`${conv.sender_id}-${conv.receiver_id}`}
              onClick={() => setActiveConv(conv)}
              className="w-full glass-card p-4 flex items-center gap-3 hover:bg-[#3b4b6e]/[0.07] transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-gradient flex items-center justify-center font-bold flex-shrink-0">
                {conv.other_user_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-semibold">{conv.other_user_name}</p>
                  <span className="text-[10px] text-white/30 flex items-center gap-1">
                    <Clock size={9} />
                    {new Date(conv.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-white/50 line-clamp-1">{conv.message_text}</p>
              </div>
              {Number(conv.unread_count) > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <Navbar />
    </div>
  )
}
