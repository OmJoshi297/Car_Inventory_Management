import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { vehiclesAPI, inventoryAPI, customersAPI, enquiriesAPI } from '../api/client'
import VehicleForm from '../components/VehicleForm'

export default function AdminPanel() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editVehicle, setEditVehicle] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [restockModal, setRestockModal] = useState(null)
  const [restockQty, setRestockQty] = useState(10)

  const [activeTab, setActiveTab] = useState('inventory')
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [deleteCustomerConfirm, setDeleteCustomerConfirm] = useState(null)

  const [enquiries, setEnquiries] = useState([])
  const [enquiriesLoading, setEnquiriesLoading] = useState(false)
  const [deleteEnquiryConfirm, setDeleteEnquiryConfirm] = useState(null)
  
  const [activeEnquiry, setActiveEnquiry] = useState(null)
  const [activeEnquiryMessages, setActiveEnquiryMessages] = useState([])
  const [activeEnquiryMessagesLoading, setActiveEnquiryMessagesLoading] = useState(false)
  const [adminMessageText, setAdminMessageText] = useState('')
  const [adminSendLoading, setAdminSendLoading] = useState(false)

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const { data } = await inventoryAPI.getPurchasesLogs()
      setLogs(data)
    } catch {
      toast.error('Failed to load purchase logs')
    } finally {
      setLogsLoading(false)
    }
  }

  const fetchCustomers = async () => {
    setCustomersLoading(true)
    try {
      const { data } = await customersAPI.list()
      setCustomers(data)
    } catch {
      toast.error('Failed to load customer list')
    } finally {
      setCustomersLoading(false)
    }
  }

  const fetchEnquiries = async () => {
    setEnquiriesLoading(true)
    try {
      const { data } = await enquiriesAPI.list()
      setEnquiries(data)
    } catch {
      toast.error('Failed to load enquiries')
    } finally {
      setEnquiriesLoading(false)
    }
  }

  useEffect(() => {
    vehiclesAPI.list().then(({ data }) => setVehicles(data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
    inventoryAPI.getPurchasesLogs().then(({ data }) => setLogs(data)).catch(() => {})
    enquiriesAPI.list().then(({ data }) => setEnquiries(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs()
    } else if (activeTab === 'inventory') {
      vehiclesAPI.list().then(({ data }) => setVehicles(data)).catch(() => {})
    } else if (activeTab === 'customers') {
      fetchCustomers()
    } else if (activeTab === 'enquiries') {
      fetchEnquiries()
    }
  }, [activeTab])

  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    try {
      if (editVehicle) {
        const { data } = await vehiclesAPI.update(editVehicle.id, payload)
        setVehicles((p) => p.map((v) => v.id === editVehicle.id ? data : v))
        toast.success('Updated! ✅')
      } else {
        const { data } = await vehiclesAPI.create(payload)
        setVehicles((p) => [data, ...p])
        toast.success('Added! 🚗')
      }
      setShowForm(false); setEditVehicle(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setFormLoading(false)
    }
  }

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await vehiclesAPI.delete(deleteConfirm.id)
      setVehicles((p) => p.filter((v) => v.id !== deleteConfirm.id))
      toast.success('Deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerConfirm) return
    try {
      await customersAPI.delete(deleteCustomerConfirm.id)
      setCustomers((prev) => prev.filter((c) => c.id !== deleteCustomerConfirm.id))
      toast.success('Customer account deleted successfully ✅')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete customer account')
    } finally {
      setDeleteCustomerConfirm(null)
    }
  }

  const handleDeleteEnquiry = async () => {
    if (!deleteEnquiryConfirm) return
    try {
      await enquiriesAPI.delete(deleteEnquiryConfirm.id)
      setEnquiries((prev) => prev.filter((e) => e.id !== deleteEnquiryConfirm.id))
      toast.success('Enquiry deleted successfully ✅')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete enquiry')
    } finally {
      setDeleteEnquiryConfirm(null)
    }
  }

  const handleAdminSendMessage = async (e) => {
    e?.preventDefault()
    if (!activeEnquiry || !adminMessageText.trim()) return

    setAdminSendLoading(true)
    try {
      const { data } = await enquiriesAPI.sendMessage(activeEnquiry.id, adminMessageText)
      setActiveEnquiryMessages((prev) => [...prev, data])
      setAdminMessageText('')
    } catch {
      toast.error('Failed to send response')
    } finally {
      setAdminSendLoading(false)
    }
  }

  useEffect(() => {
    if (!activeEnquiry || activeTab !== 'enquiries') return

    const fetchActiveMsgs = async () => {
      try {
        const { data } = await enquiriesAPI.getMessages(activeEnquiry.id)
        setActiveEnquiryMessages(data)
      } catch (err) {
        console.error('Failed to fetch messages for admin:', err)
      }
    }

    fetchActiveMsgs()
    const interval = setInterval(fetchActiveMsgs, 3000)
    return () => clearInterval(interval)
  }, [activeEnquiry, activeTab])

  const handleRestock = async () => {
    try {
      const { data } = await inventoryAPI.restock(restockModal.id, restockQty)
      setVehicles((p) => p.map((v) => v.id === restockModal.id ? { ...v, quantity: data.new_quantity } : v))
      toast.success(data.message); setRestockModal(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Restock failed')
    }
  }

  const totalValue = vehicles.reduce((s, v) => s + v.price * v.quantity, 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative py-10 px-4"
           style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a0a2e 50%, #0f172a 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1">
                🛠️ Admin <span className="text-gradient">Control Panel</span>
              </h1>
              <p className="text-slate-400">Manage your full vehicle inventory</p>
            </div>
            {activeTab === 'inventory' && (
              <button
                id="admin-add-vehicle-btn"
                onClick={() => { setEditVehicle(null); setShowForm(true) }}
                className="btn-primary"
              >
                + Add New Vehicle
              </button>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Listings', value: vehicles.length, icon: '🚗', color: 'text-indigo-400' },
              { label: 'In Stock', value: vehicles.filter((v) => v.quantity > 0).length, icon: '✅', color: 'text-green-400' },
              { label: 'Out of Stock', value: vehicles.filter((v) => v.quantity === 0).length, icon: '⛔', color: 'text-red-400' },
              { label: 'Inventory Value', value: `$${Math.round(totalValue).toLocaleString()}`, icon: '💰', color: 'text-amber-400' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="stat-card">
                <span className="text-2xl">{icon}</span>
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-700/50 gap-6">
          <button
            id="tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📦 Inventory Management
            {activeTab === 'inventory' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
          <button
            id="tab-logs"
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📜 Purchase Logs ({logs.length})
            {activeTab === 'logs' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
          <button
            id="tab-customers"
            onClick={() => setActiveTab('customers')}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 Customer Management
            {activeTab === 'customers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
          <button
            id="tab-enquiries"
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
              activeTab === 'enquiries'
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ✉️ Enquiries ({enquiries.length})
            {activeTab === 'enquiries' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="glass-card overflow-hidden">
          {activeTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['ID', 'Vehicle', 'Category', 'Price', 'Qty', 'Mileage', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No vehicles in inventory
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono">#{v.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-200">{v.year} {v.make} {v.model}</p>
                          {v.color && <p className="text-xs text-slate-500">{v.color}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {v.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          ${v.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${
                            v.quantity === 0 ? 'text-red-400' : v.quantity <= 2 ? 'text-amber-400' : 'text-green-400'
                          }`}>
                            {v.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {v.mileage === 0 ? 'New' : `${v.mileage.toLocaleString()} mi`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              id={`admin-edit-${v.id}`}
                              onClick={() => { setEditVehicle(v); setShowForm(true) }}
                              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              id={`admin-restock-${v.id}`}
                              onClick={() => { setRestockModal(v); setRestockQty(10) }}
                              className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-500/30"
                            >
                              Restock
                            </button>
                             <button
                              id={`admin-delete-${v.id}`}
                              onClick={() => setDeleteConfirm(v)}
                              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2.5 py-1.5 rounded-lg transition-colors border border-red-500/30"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Log ID', 'Timestamp', 'Customer', 'Vehicle', 'Quantity', 'Total Price', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {logsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No purchase logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono">#{log.id}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                              {log.username[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-200">{log.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-200">
                          {log.vehicle_make} {log.vehicle_model}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium">
                          {log.quantity}
                        </td>
                        <td className="px-4 py-3 font-bold text-green-400">
                          ${log.total_price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Customer ID', 'Username', 'Email Address', 'Registration Date', 'Role', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {customersLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono">#{c.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                              {c.username[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-200">{c.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {c.email}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-slate-500/10 text-slate-300 border border-slate-500/20 text-xs">
                            Customer
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            id={`admin-delete-customer-${c.id}`}
                            onClick={() => setDeleteCustomerConfirm(c)}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2.5 py-1.5 rounded-lg transition-colors border border-red-500/30"
                          >
                            Delete Account
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'enquiries' && (
            <div className="flex h-[550px] border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/30 backdrop-blur-md">
              {/* Left pane: Threads list */}
              <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-950/20">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Chat Threads</h4>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                  {enquiriesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 space-y-2 animate-pulse">
                        <div className="h-4 bg-slate-800 rounded w-2/3" />
                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                      </div>
                    ))
                  ) : enquiries.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No active enquiries found.</div>
                  ) : (
                    enquiries.map((e) => {
                      const isActive = activeEnquiry?.id === e.id
                      return (
                        <div
                          key={e.id}
                          onClick={() => setActiveEnquiry(e)}
                          className={`p-4 cursor-pointer transition-colors relative flex justify-between items-start gap-2 ${
                            isActive ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-1 mb-1">
                              <p className="font-semibold text-xs text-slate-200 truncate">{e.name}</p>
                              <span className="text-[9px] text-slate-500 shrink-0">
                                {new Date(e.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[10px] text-indigo-400 font-medium truncate mb-1">
                              Support Chat Thread
                            </p>
                            <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                              {e.message}
                            </p>
                          </div>
                          <button
                            id={`admin-delete-enquiry-${e.id}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteEnquiryConfirm(e)
                            }}
                            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors hover:bg-red-500/10 shrink-0"
                            title="Delete Chat Thread"
                          >
                            🗑️
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right pane: Chat Area */}
              <div className="w-2/3 flex flex-col bg-slate-900/10 justify-between overflow-hidden">
                {activeEnquiry ? (
                  <>
                    {/* Active Thread Header */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">
                          Chatting with {activeEnquiry.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Email: {activeEnquiry.email} | Support Chatroom
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveEnquiry(null)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded transition-colors"
                      >
                        Close Chat
                      </button>
                    </div>

                    {/* Messages History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/15">
                      {activeEnquiryMessagesLoading && activeEnquiryMessages.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
                        </div>
                      ) : activeEnquiryMessages.length === 0 ? (
                        <div className="text-center py-20 text-slate-500 text-xs">
                          Loading conversation logs...
                        </div>
                      ) : (
                        activeEnquiryMessages.map((msg) => {
                          const isMe = msg.is_from_admin
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[80%] ${
                                isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                              }`}
                            >
                              <span className="text-[9px] text-slate-400 mb-0.5 px-1">
                                {isMe ? '🛡️ You (Admin)' : msg.sender_name}
                              </span>
                              <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                  isMe
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-glow'
                                    : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                }`}
                              >
                                {msg.message}
                              </div>
                              <span className="text-[8px] text-slate-500 mt-0.5 px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Input Footer */}
                    <form onSubmit={handleAdminSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/30 flex gap-2">
                      <input
                        type="text"
                        value={adminMessageText}
                        onChange={(e) => setAdminMessageText(e.target.value)}
                        className="form-input text-xs flex-1 rounded-xl py-2 px-3 bg-slate-950/50 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                        placeholder="Type a response to reply..."
                        disabled={adminSendLoading}
                        required
                      />
                      <button
                        id="admin-send-chat-btn"
                        type="submit"
                        className="btn-primary px-4 py-2 text-xs rounded-xl font-bold flex items-center justify-center shrink-0"
                        disabled={adminSendLoading || !adminMessageText.trim()}
                      >
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-slate-500 text-xs p-8 text-center">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="font-semibold text-slate-400">No Chat Selected</p>
                    <p className="mt-1 max-w-xs text-[11px]">
                      Select an enquiry thread from the active chat threads list on the left to start a real-time 2-way conversation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <VehicleForm
          vehicle={editVehicle}
          loading={formLoading}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditVehicle(null) }}
        />
      )}

      {restockModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-1">📦 Restock Vehicle</h3>
            <p className="text-slate-400 text-sm mb-4">
              {restockModal.year} {restockModal.make} {restockModal.model} — current stock: <strong className="text-white">{restockModal.quantity}</strong>
            </p>
            <label className="block text-xs text-slate-400 mb-2 font-medium">Units to add</label>
            <input
              id="admin-restock-qty"
              type="number" min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              className="form-input mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setRestockModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button id="admin-confirm-restock" onClick={handleRestock} className="btn-primary flex-1">
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-1">🗑️ Delete Vehicle</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to permanently delete <strong>{deleteConfirm.year} {deleteConfirm.make} {deleteConfirm.model}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                id="admin-confirm-delete"
                onClick={handleConfirmDelete}
                className="btn-danger flex-1 py-2 font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteCustomerConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-1">🗑️ Delete Customer Account</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to permanently delete customer account <strong>{deleteCustomerConfirm.username}</strong> ({deleteCustomerConfirm.email})? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCustomerConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                id="admin-confirm-delete-customer"
                onClick={handleDeleteCustomer}
                className="btn-danger flex-1 py-2 font-semibold"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Enquiry Confirmation Modal */}
      {deleteEnquiryConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-1">🗑️ Delete Enquiry</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to permanently delete this enquiry from <strong>{deleteEnquiryConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEnquiryConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                id="admin-confirm-delete-enquiry"
                onClick={handleDeleteEnquiry}
                className="btn-danger flex-1 py-2 font-semibold"
              >
                Delete Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
