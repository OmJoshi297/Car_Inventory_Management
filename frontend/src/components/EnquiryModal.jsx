import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { enquiriesAPI } from '../api/client'

export default function EnquiryModal({ user, onClose }) {
  const [enquiryId, setEnquiryId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sendLoading, setSendLoading] = useState(false)

  // Initial Form state (if starting a new thread)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [initialMsg, setInitialMsg] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const chatEndRef = useRef(null)

  // Determine if user has an active chat thread
  useEffect(() => {
    if (user) {
      setName(user.username || '')
      setEmail(user.email || '')
      
      // Look up if user has an existing support thread
      setMessagesLoading(true)
      enquiriesAPI.listMy()
        .then(({ data }) => {
          if (data && data.length > 0) {
            setEnquiryId(data[0].id)
          }
        })
        .catch(() => {})
        .finally(() => setMessagesLoading(false))
    } else {
      // Guest: check localStorage
      const guestId = localStorage.getItem('dealer_support_chat_id')
      if (guestId) {
        setEnquiryId(Number(guestId))
      }
    }
  }, [user])

  // Poll for new messages if enquiryId exists
  useEffect(() => {
    if (!enquiryId) return

    const fetchMsgs = async () => {
      try {
        const { data } = await enquiriesAPI.getMessages(enquiryId)
        setMessages(data)
      } catch (err) {
        console.error('Failed to poll messages:', err)
      }
    }

    fetchMsgs()
    const interval = setInterval(fetchMsgs, 3000)
    return () => clearInterval(interval)
  }, [enquiryId])

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartChat = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !initialMsg.trim()) {
      setFormError('All fields are required.')
      return
    }

    setFormLoading(true)
    setFormError('')
    try {
      const { data } = await enquiriesAPI.create({
        name,
        email,
        message: initialMsg
      })
      setEnquiryId(data.id)
      if (!user) {
        localStorage.setItem('dealer_support_chat_id', data.id)
      }
      toast.success('Chat session started! Ask us anything.')
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to start chat')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !enquiryId) return

    setSendLoading(true)
    try {
      const { data } = await enquiriesAPI.sendMessage(enquiryId, newMessage)
      setMessages((prev) => [...prev, data])
      setNewMessage('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#e6eef8] w-full max-w-md h-[550px] flex flex-col animate-slide-up overflow-hidden rounded-3xl p-5"
           style={{ boxShadow: '12px 12px 24px #c2cbda, -12px -12px 24px #ffffff' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#e6eef8] rounded-2xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] mb-4 border border-[#d8e0ed]/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-[#1d1d1f]">AutoVault Support</span>
              <span className="text-[10px] text-[#8e98aa] font-bold mt-0.5">
                Ask us anything in real-time
              </span>
            </div>
          </div>
          <button
            id="close-enquiry-modal"
            onClick={onClose}
            className="text-[#8e98aa] hover:text-[#1d1d1f] p-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        {!enquiryId ? (
          /* Step 1: Initial Form to start chat thread */
          <form onSubmit={handleStartChat} className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <p className="text-xs text-[#8e98aa] font-bold">
                Please enter your details to open a support ticket.
              </p>
              {formError && <p className="text-red-500 text-xs font-bold">{formError}</p>}
              
              <div>
                <label className="block text-xs text-[#8e98aa] mb-1.5 font-bold uppercase tracking-wider">Your Name *</label>
                <input
                  id="enquiry-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFormError('') }}
                  className="form-input text-sm"
                  placeholder="e.g. Jane Doe"
                  required
                  disabled={user !== null}
                />
              </div>

              <div>
                <label className="block text-xs text-[#8e98aa] mb-1.5 font-bold uppercase tracking-wider">Email Address *</label>
                <input
                  id="enquiry-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormError('') }}
                  className="form-input text-sm"
                  placeholder="jane@example.com"
                  required
                  disabled={user !== null}
                />
              </div>

              <div>
                <label className="block text-xs text-[#8e98aa] mb-1.5 font-bold uppercase tracking-wider">Your Question *</label>
                <textarea
                  id="enquiry-message"
                  value={initialMsg}
                  onChange={(e) => { setInitialMsg(e.target.value); setFormError('') }}
                  className="form-input text-sm min-h-[100px] resize-none"
                  placeholder="I want to know about trade-ins and finance options..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                id="submit-enquiry-btn"
                type="submit"
                className="btn-primary flex-1 font-bold"
                disabled={formLoading}
              >
                {formLoading ? 'Connecting...' : 'Start Chat'}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Chat Room Window */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 shadow-[inset_1.5px_1.5px_3.5px_#c2cbda,inset_-1.5px_-1.5px_3.5px_#ffffff] rounded-2xl mb-4">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0071e3]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-[#8e98aa] text-xs font-bold animate-pulse">
                  Connecting to thread...
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.is_from_admin
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        isAdmin ? 'mr-auto items-start' : 'ml-auto items-end'
                      }`}
                    >
                      <span className="text-[9px] text-[#8e98aa] font-bold mb-0.5 px-1">
                        {isAdmin ? '🛡️ Dealer Support Admin' : msg.sender_name}
                      </span>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold ${
                          isAdmin
                            ? 'bg-[#e6eef8] text-[#1d1d1f] rounded-tl-none shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]'
                            : 'bg-[#e6eef8] text-[#0071e3] rounded-tr-none shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] border border-[#0071e3]/10'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[8px] text-[#8e98aa] mt-0.5 px-1 font-bold">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-1 flex gap-2 items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="form-input text-xs flex-1"
                placeholder="Type a message..."
                disabled={sendLoading}
                required
              />
              <button
                type="submit"
                className="btn-primary px-4 py-2.5 text-xs rounded-xl font-bold flex items-center justify-center shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
                disabled={sendLoading || !newMessage.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
