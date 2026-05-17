import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { messageService } from '@/services/messageService'
import { X, Send, Search, ChevronLeft, MessageSquare, ImageIcon, Circle } from 'lucide-react'
import { Image } from "@/utils/compat"
import NumberBadge from './ui/NumberBadge'

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'chat'
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMap, setUnreadMap] = useState({})
  const [typingUsers, setTypingUsers] = useState({}) // roomId -> { userName, timeout }
  const [onlineUsers, setOnlineUsers] = useState({}) // userId -> boolean
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)
  const imageInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const wsRef = useRef(null)

  // Reset chat state when user changes
  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false)
      setView('list')
      setSelectedRoom(null)
      setMessages([])
      setRooms([])
      setUnreadCount(0)
      setUnreadMap({})
    } else {
      setIsOpen(true)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadRooms()
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isOpen, isAuthenticated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (view === 'chat' && selectedRoom) {
      pollRef.current = setInterval(() => {
        loadMessages(selectedRoom.room_id, true)
      }, 5000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [view, selectedRoom])

  // Fetch unread counts using the new API
  useEffect(() => {
    if (!isAuthenticated) return
    const loadUnread = async () => {
      try {
        const counts = await messageService.getUnreadCounts()
        setUnreadMap(counts)
        const total = Object.values(counts).reduce((sum, c) => sum + c, 0)
        setUnreadCount(total)
      } catch {
        // Fallback to old method
        try {
          const data = await messageService.getMyPrivateChats()
          const total = (data || []).reduce((sum, r) => sum + (r.unread_count || 0), 0)
          setUnreadCount(total)
        } catch { /* ignore */ }
      }
    }
    loadUnread()
    const interval = setInterval(loadUnread, 15000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Check online status for room users
  useEffect(() => {
    if (!isAuthenticated || rooms.length === 0) return
    const checkOnline = async () => {
      const statuses = {}
      // Only check online status for the first 5 active chats to save requests
      for (const room of rooms.slice(0, 5)) {
        if (room.other_user_id) {
          try {
            statuses[room.other_user_id] = await messageService.isUserOnline(room.other_user_id)
          } catch {
            statuses[room.other_user_id] = false
          }
        }
      }
      setOnlineUsers(statuses)
    }
    checkOnline()
    const interval = setInterval(checkOnline, 60000) // Increase to 60s
    return () => clearInterval(interval)
  }, [isAuthenticated, rooms])

  const loadRooms = async () => {
    try {
      const data = await messageService.getMyPrivateChats()
      setRooms(data)
      const total = (data || []).reduce((sum, r) => sum + (r.unread_count || 0), 0)
      setUnreadCount(total)
    } catch (err) {
      console.error('Failed to load chats:', err)
    }
  }

  const loadMessages = async (roomId, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await messageService.getRoomMessages(roomId)
      const messagesWithIsMe = data.map(msg => ({
        ...msg,
        isMe: msg.sender_id === user?.id
      }))
      setMessages(messagesWithIsMe)
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const openChat = async (room) => {
    setSelectedRoom(room)
    setView('chat')
    await loadMessages(room.room_id)
    // Mark as read when opening chat
    try {
      await messageService.markAsRead(room.room_id)
      setUnreadMap(prev => ({ ...prev, [room.room_id]: 0 }))
      setUnreadCount(prev => Math.max(0, prev - (unreadMap[room.room_id] || 0)))
    } catch { /* ignore */ }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom) return

    try {
      await messageService.sendRoomMessage(selectedRoom.room_id, {
        content: newMessage.trim(),
      })
      setNewMessage('')
      await loadMessages(selectedRoom.room_id, true)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleSendImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return
    try {
      await messageService.sendImageMessage(selectedRoom.room_id, file)
      await loadMessages(selectedRoom.room_id, true)
    } catch (err) {
      console.error('Failed to send image:', err)
    }
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const goBack = () => {
    setView('list')
    setSelectedRoom(null)
    setMessages([])
    loadRooms()
  }

  const startChatWith = useCallback(async (otherUserId, otherUserName) => {
    if (!isAuthenticated) return
    try {
      const chat = await messageService.createOrGetPrivateChat({ other_user_id: otherUserId })
      setIsOpen(true)
      setSelectedRoom({ room_id: chat.room_id, other_user_name: otherUserName || chat.other_user_name, other_user_id: otherUserId })
      setView('chat')
      await loadMessages(chat.room_id)
      try { await messageService.markAsRead(chat.room_id) } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to start chat:', err)
    }
  }, [isAuthenticated])

  useEffect(() => {
    window.__chatWidget = { startChatWith }
    return () => { delete window.__chatWidget }
  }, [startChatWith])

  if (!isAuthenticated) return null

  const filteredRooms = rooms.filter(r => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const userName = (r.other_user_name || '').toLowerCase()
    const shopName = (r.other_shop_name || '').toLowerCase()
    return userName.includes(q) || shopName.includes(q)
  })

  const renderMessageContent = (msg) => {
    if (msg.type === 'IMAGE' && msg.content) {
      return (
        <div className="relative w-48 h-48 rounded-lg overflow-hidden cursor-pointer">
          <Image
            src={msg.content}
            alt="Image message"
            fill
            className="object-cover"
            onClick={() => window.open(msg.content, '_blank')}
          />
        </div>
      )
    }
    return <p className="whitespace-pre-wrap break-words">{msg.content}</p>
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9998] bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95"
        aria-label="Chat"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageSquare size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2">
                <NumberBadge value={unreadCount} variant="badge" size="sm" color="red" max={9} />
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
            {view === 'chat' && (
              <button onClick={goBack} className="p-1 hover:bg-green-500 rounded-full transition">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                {view === 'chat'
                  ? (selectedRoom?.other_user_name || 'Chat')
                  : 'Chat'
                }
                {view === 'chat' && selectedRoom?.other_user_id && onlineUsers[selectedRoom.other_user_id] && (
                  <Circle size={8} fill="#4ade80" className="text-green-400" />
                )}
              </h3>
              {view === 'list' && (
                <p className="text-xs text-green-100">{rooms.length} conversations</p>
              )}
              {view === 'chat' && selectedRoom?.other_user_id && (
                <p className="text-xs text-green-100">
                  {onlineUsers[selectedRoom.other_user_id] ? 'Online' : 'Offline'}
                </p>
              )}
            </div>
          </div>

          {view === 'list' ? (
            /* Room List View */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or shop..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200 transition"
                  />
                </div>
              </div>

              {/* Rooms */}
              <div className="flex-1 overflow-y-auto">
                {filteredRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6">
                    <MessageSquare size={48} className="mb-3 opacity-30" />
                    <p className="text-sm text-center">No conversations yet.<br />Visit a shop and start chatting!</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const roomUnread = unreadMap[room.room_id] || room.unread_count || 0
                    const isOnline = onlineUsers[room.other_user_id]
                    return (
                      <button
                        key={room.room_id}
                        onClick={() => openChat(room)}
                        className="w-full p-3 hover:bg-slate-50 transition text-left border-b border-slate-50 flex items-center gap-3"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {(room.other_user_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${roomUnread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                            {room.other_user_name || 'User'}
                          </p>
                          {room.other_shop_name && (
                            <p className="text-[10px] text-green-600 truncate">{room.other_shop_name}</p>
                          )}
                          <p className={`text-xs truncate ${roomUnread > 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                            {room.last_message || 'Start a conversation'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {room.last_message_at && (
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {formatRelativeTime(room.last_message_at)}
                            </span>
                          )}
                          {roomUnread > 0 && (
                            <span className="bg-green-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                              {roomUnread > 9 ? '9+' : roomUnread}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            /* Chat View */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No messages yet. Say hi!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.isMe || msg.sender_id === user?.id
                    return (
                      <div key={`${msg.message_id}-${idx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-green-600 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                        }`}>
                          {!isMe && msg.sender_name && (
                            <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.sender_name}</p>
                          )}
                          {renderMessageContent(msg)}
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-green-200' : 'text-slate-400'}`}>
                            {new Date(msg.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2">
                {/* Image upload button */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-green-600 transition rounded-full hover:bg-slate-50"
                  title="Send image"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSendImage}
                  hidden
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-green-200 transition"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
}
