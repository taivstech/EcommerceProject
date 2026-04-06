import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { messageService } from '@/services/messageService'
import { Send, Search, ChevronLeft, MessageSquare, ImageIcon } from 'lucide-react'
import { Image } from "@/utils/compat"

export default function AdminChatPage() {
    const { user, isAuthenticated } = useAuth()
    const [rooms, setRooms] = useState([])
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const pollRef = useRef(null)
    const imageInputRef = useRef(null)

    useEffect(() => {
        if (isAuthenticated) loadRooms()
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [isAuthenticated])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current)
        if (selectedRoom) {
            pollRef.current = setInterval(() => loadMessages(selectedRoom.room_id, true), 5000)
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [selectedRoom])

    const loadRooms = async () => {
        try {
            const data = await messageService.getMyPrivateChats()
            setRooms(data)
        } catch (err) {
            console.error('Failed to load chats:', err)
        }
    }

    const loadMessages = async (roomId, silent = false) => {
        if (!silent) setLoading(true)
        try {
            const data = await messageService.getRoomMessages(roomId)
            // Add isMe field to each message for easier use
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
        await loadMessages(room.room_id)
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedRoom) return
        try {
            await messageService.sendRoomMessage(selectedRoom.room_id, { content: newMessage.trim() })
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

    const filteredRooms = rooms.filter(r => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (r.other_user_name || '').toLowerCase().includes(q) ||
               (r.other_shop_name || '').toLowerCase().includes(q)
    })

    const renderMessageContent = (msg) => {
        if (msg.type === 'IMAGE' && msg.content) {
            return (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden cursor-pointer">
                    <Image src={msg.content} alt="Image" fill className="object-cover" onClick={() => window.open(msg.content, '_blank')} />
                </div>
            )
        }
        return <p className="whitespace-pre-wrap break-words">{msg.content}</p>
    }

    return (
        <div className="flex h-[calc(100vh-80px)] bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Room List */}
            <div className={`${selectedRoom ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-200`}>
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-3">Chat</h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or shop..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-200"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 px-6">
                            <MessageSquare size={48} className="mb-3 opacity-30" />
                            <p className="text-sm text-center">No conversations yet</p>
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <button
                                key={room.room_id}
                                onClick={() => openChat(room)}
                                className={`w-full p-3 hover:bg-slate-50 transition text-left border-b border-slate-50 flex items-center gap-3 ${selectedRoom?.room_id === room.room_id ? 'bg-green-50' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
                                    {(room.other_user_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{room.other_user_name || 'User'}</p>
                                    {room.other_shop_name && (
                                        <p className="text-[10px] text-green-600 truncate">{room.other_shop_name}</p>
                                    )}
                                    <p className="text-xs text-slate-500 truncate">{room.last_message || 'Start a conversation'}</p>
                                </div>
                                {room.last_message_at && (
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                        {formatRelativeTime(room.last_message_at)}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
                {selectedRoom ? (
                    <>
                        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
                            <button onClick={() => setSelectedRoom(null)} className="md:hidden p-1 hover:bg-green-500 rounded-full">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                                {(selectedRoom.other_user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{selectedRoom.other_user_name || 'Chat'}</p>
                                {selectedRoom.other_shop_name && (
                                    <p className="text-xs text-green-200">{selectedRoom.other_shop_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading...</div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No messages yet. Say hi!</div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.isMe || msg.sender_id === user?.id
                                    return (
                                        <div key={`${msg.message_id}-${idx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-green-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
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

                        <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2">
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-green-600 transition rounded-full hover:bg-slate-50" title="Send image">
                                <ImageIcon size={18} />
                            </button>
                            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleSendImage} hidden />
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-green-200"
                            />
                            <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition disabled:opacity-40">
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <MessageSquare size={56} className="mx-auto mb-3 opacity-30" />
                            <p className="text-lg font-medium">Select a conversation</p>
                            <p className="text-sm">Choose a chat from the sidebar to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
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
