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
    <div className="min-h-screen bg-[#e6eef8] py-4">
      {/* Header / Top bar */}
      <div className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 bg-[#e6eef8] p-8 sm:p-10 mb-8 border border-[#d8e0ed]"
           style={{ boxShadow: '6px 6px 12px #c2cbda, -6px -6px 12px #ffffff' }}>
        {/* Grid texture */}
        <div className="absolute inset-0 grid-texture opacity-30" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1d1d1f] mb-1.5 leading-none">
                🛠️ Admin <span className="text-gradient">Control Panel</span>
              </h1>
              <p className="text-[#8e98aa] text-sm font-bold">Manage your full vehicle inventory</p>
            </div>
            {activeTab === 'inventory' && (
              <button
                id="admin-add-vehicle-btn"
                onClick={() => { setEditVehicle(null); setShowForm(true) }}
                className="btn-primary py-2 px-4 shadow-[4px_4px_8px_#c2cbda,-4px_-4px_8px_#ffffff]"
              >
                + Add New Vehicle
              </button>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Total Listings', value: vehicles.length, icon: '🚗', color: 'text-indigo-600' },
              { label: 'In Stock', value: vehicles.filter((v) => v.quantity > 0).length, icon: '✅', color: 'text-emerald-600' },
              { label: 'Out of Stock', value: vehicles.filter((v) => v.quantity === 0).length, icon: '⛔', color: 'text-red-500' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="stat-card" style={{ boxShadow: 'inset 3px 3px 6px #c2cbda, inset -3px -3px 6px #ffffff' }}>
                <span className="text-2xl mb-1.5">{icon}</span>
                <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
                <span className="text-[10px] text-[#8e98aa] font-bold mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-4">
        <div className="flex flex-wrap p-1.5 rounded-2xl bg-[#e6eef8] shadow-[inset_2.5px_2.5px_5px_#c2cbda,inset_-2.5px_-2.5px_5px_#ffffff] gap-2">
          {[
            { key: 'inventory', label: '📦 Inventory Management' },
            { key: 'logs', label: `📜 Purchase Logs (${logs.length})` },
            { key: 'customers', label: '👥 Customer Management' },
            { key: 'enquiries', label: `✉️ Enquiries (${enquiries.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              id={`tab-${key}`}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === key
                  ? 'text-[#0071e3] shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]'
                  : 'text-[#8e98aa] hover:text-[#1d1d1f]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="glass-card overflow-hidden p-2">
          {activeTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d8e0ed]">
                    {['ID', 'Vehicle', 'Category', 'Price', 'Qty', 'Mileage', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-[#8e98aa] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8e0ed]/50">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((__, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-[#dae3ee] rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[#8e98aa] font-bold">
                        No vehicles in inventory
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-[#fafbfc]/20 transition-colors">
                        <td className="px-4 py-3.5 text-[#8e98aa] font-mono font-bold">#{v.id}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#1d1d1f]">{v.year} {v.make} {v.model}</p>
                          {v.color && <p className="text-xs text-[#8e98aa] font-semibold">{v.color}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="badge text-[#0071e3] font-bold">
                            {v.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#1d1d1f]">
                          ${v.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`font-extrabold ${
                            v.quantity === 0 ? 'text-red-500' : v.quantity <= 2 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {v.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#51576c] font-semibold">
                          {v.mileage === 0 ? 'New' : `${v.mileage.toLocaleString()} mi`}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              id={`admin-edit-${v.id}`}
                              onClick={() => { setEditVehicle(v); setShowForm(true) }}
                              className="text-xs bg-[#e6eef8] text-[#1d1d1f] font-semibold px-2.5 py-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
                            >
                              Edit
                            </button>
                            <button
                              id={`admin-restock-${v.id}`}
                              onClick={() => { setRestockModal(v); setRestockQty(10) }}
                              className="text-xs bg-[#e6eef8] text-[#0071e3] font-semibold px-2.5 py-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
                            >
                              Restock
                            </button>
                             <button
                              id={`admin-delete-${v.id}`}
                              onClick={() => setDeleteConfirm(v)}
                              className="text-xs bg-[#e6eef8] text-red-500 font-semibold px-2.5 py-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
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
                  <tr className="border-b border-[#d8e0ed]">
                    {['Log ID', 'Timestamp', 'Customer', 'Vehicle', 'Quantity', 'Total Price', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-[#8e98aa] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8e0ed]/50">
                  {logsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((__, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-[#dae3ee] rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[#8e98aa] font-bold">
                        No purchase logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#fafbfc]/20 transition-colors">
                        <td className="px-4 py-3.5 text-[#8e98aa] font-mono font-bold">#{log.id}</td>
                        <td className="px-4 py-3.5 text-[#51576c] font-semibold">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#e6eef8] text-[#0071e3] flex items-center justify-center text-xs font-bold shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]">
                              {log.username[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-[#1d1d1f]">{log.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#1d1d1f]">
                          {log.vehicle_make} {log.vehicle_model}
                        </td>
                        <td className="px-4 py-3.5 text-[#1d1d1f] font-bold">
                          {log.quantity}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-emerald-600">
                          ${log.total_price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="badge text-emerald-600 font-bold">
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
                  <tr className="border-b border-[#d8e0ed]">
                    {['Customer ID', 'Username', 'Email Address', 'Registration Date', 'Role', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-[#8e98aa] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8e0ed]/50">
                  {customersLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((__, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-[#dae3ee] rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[#8e98aa] font-bold">
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#fafbfc]/20 transition-colors">
                        <td className="px-4 py-3.5 text-[#8e98aa] font-mono font-bold">#{c.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#e6eef8] text-[#0071e3] flex items-center justify-center text-xs font-bold shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]">
                              {c.username[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-[#1d1d1f]">{c.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[#51576c] font-semibold">
                          {c.email}
                        </td>
                        <td className="px-4 py-3.5 text-[#8e98aa] font-semibold">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="badge text-[#51576c] font-bold">
                            Customer
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            id={`admin-delete-customer-${c.id}`}
                            onClick={() => setDeleteCustomerConfirm(c)}
                            className="text-xs bg-[#e6eef8] text-red-500 font-semibold px-2.5 py-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
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
            <div className="flex h-[550px] border border-[#d8e0ed] rounded-2xl overflow-hidden bg-[#e6eef8] p-1.5 shadow-[inset_2.5px_2.5px_5px_#c2cbda,inset_-2.5px_-2.5px_5px_#ffffff]">
              {/* Left pane: Threads list */}
              <div className="w-1/3 border-r border-[#d8e0ed] flex flex-col bg-[#e6eef8] py-2">
                <div className="p-3 bg-[#e6eef8] mb-2 px-4">
                  <h4 className="text-[11px] font-bold text-[#8e98aa] uppercase tracking-wider">Active Chat Threads</h4>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {enquiriesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 mx-2 space-y-2 animate-pulse bg-[#e6eef8] rounded-xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]">
                        <div className="h-4 bg-[#dae3ee] rounded w-2/3" />
                        <div className="h-3 bg-[#dae3ee] rounded w-1/2" />
                      </div>
                    ))
                  ) : enquiries.length === 0 ? (
                    <div className="p-8 text-center text-[#8e98aa] text-xs font-bold">No active enquiries found.</div>
                  ) : (
                    enquiries.map((e) => {
                      const isActive = activeEnquiry?.id === e.id
                      return (
                        <div
                          key={e.id}
                          onClick={() => setActiveEnquiry(e)}
                          className={`p-3.5 cursor-pointer transition-all duration-150 relative flex justify-between items-start gap-2 ${
                            isActive
                              ? 'bg-[#e6eef8] shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] rounded-xl mx-2 border-l-2 border-[#0071e3]'
                              : 'bg-[#e6eef8] hover:bg-[#fafbfc]/20 rounded-xl mx-2 shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-1 mb-1">
                              <p className="font-bold text-xs text-[#1d1d1f] truncate">{e.name}</p>
                              <span className="text-[9px] text-[#8e98aa] font-bold shrink-0">
                                {new Date(e.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#0071e3] font-bold truncate mb-1">
                              Support Chat Thread
                            </p>
                            <p className="text-[10px] text-[#51576c] font-medium truncate leading-relaxed">
                              {e.message}
                            </p>
                          </div>
                          <button
                            id={`admin-delete-enquiry-${e.id}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteEnquiryConfirm(e)
                            }}
                            className="text-[#8e98aa] hover:text-red-500 p-1.5 rounded-lg shadow-[1.5px_1.5px_3px_#c2cbda,-1.5px_-1.5px_3px_#ffffff] active:shadow-[inset_1px_1px_2.5px_#c2cbda,inset_-1px_-1px_2.5px_#ffffff] shrink-0"
                            title="Delete Chat Thread"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right pane: Chat Area */}
              <div className="w-2/3 flex flex-col bg-[#e6eef8] justify-between overflow-hidden py-2">
                {activeEnquiry ? (
                  <>
                    {/* Active Thread Header */}
                    <div className="p-4 bg-[#e6eef8] flex justify-between items-center mx-2 rounded-2xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] mb-2 border border-[#d8e0ed]/20">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1d1d1f]">
                          Chatting with {activeEnquiry.name}
                        </h4>
                        <p className="text-[10px] text-[#8e98aa] mt-0.5 font-bold">
                          Email: {activeEnquiry.email} | Support Chatroom
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveEnquiry(null)}
                        className="text-xs bg-[#e6eef8] text-[#51576c] font-bold px-3 py-1.5 rounded-xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
                      >
                        Close Chat
                      </button>
                    </div>

                    {/* Messages History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e6eef8] shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff] rounded-2xl mx-2 my-1">
                      {activeEnquiryMessagesLoading && activeEnquiryMessages.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0071e3]" />
                        </div>
                      ) : activeEnquiryMessages.length === 0 ? (
                        <div className="text-center py-20 text-[#8e98aa] text-xs font-bold">
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
                              <span className="text-[9px] text-[#8e98aa] font-bold mb-0.5 px-1">
                                {isMe ? '🛡️ You (Admin)' : msg.sender_name}
                              </span>
                              <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed font-semibold ${
                                  isMe
                                    ? 'bg-[#e6eef8] text-[#0071e3] rounded-tr-none shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] border border-[#0071e3]/10'
                                    : 'bg-[#e6eef8] text-[#1d1d1f] rounded-tl-none shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]'
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
                    </div>

                    {/* Input Footer */}
                    <form onSubmit={handleAdminSendMessage} className="p-3 bg-[#e6eef8] flex gap-2 items-center">
                      <input
                        type="text"
                        value={adminMessageText}
                        onChange={(e) => setAdminMessageText(e.target.value)}
                        className="form-input text-xs flex-1 py-2 px-3 focus:outline-none"
                        placeholder="Type a response to reply..."
                        disabled={adminSendLoading}
                        required
                      />
                      <button
                        id="admin-send-chat-btn"
                        type="submit"
                        className="btn-primary px-4 py-2.5 text-xs rounded-xl font-bold flex items-center justify-center shrink-0 shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
                        disabled={adminSendLoading || !adminMessageText.trim()}
                      >
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-[#8e98aa] text-xs p-8 text-center">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="font-bold text-[#51576c]">No Chat Selected</p>
                    <p className="mt-1.5 max-w-xs text-[11px] font-bold">
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
        <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#e6eef8] rounded-3xl w-full max-w-sm p-6 animate-slide-up shadow-[12px_12px_24px_#c2cbda,-12px_-12px_24px_#ffffff]">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">📦 Restock Vehicle</h3>
            <p className="text-[#8e98aa] text-sm mb-4 font-bold">
              {restockModal.year} {restockModal.make} {restockModal.model} — current stock: <strong className="text-[#1d1d1f]">{restockModal.quantity}</strong>
            </p>
            <label className="block text-xs text-[#8e98aa] mb-2 font-bold uppercase tracking-wider">Units to add</label>
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
        <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#e6eef8] rounded-3xl w-full max-w-sm p-6 animate-slide-up shadow-[12px_12px_24px_#c2cbda,-12px_-12px_24px_#ffffff]">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">🗑️ Delete Vehicle</h3>
            <p className="text-[#8e98aa] text-sm mb-6 font-bold leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteConfirm.year} {deleteConfirm.make} {deleteConfirm.model}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                id="admin-confirm-delete"
                onClick={handleConfirmDelete}
                className="btn-danger flex-1 py-2.5 font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteCustomerConfirm && (
        <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#e6eef8] rounded-3xl w-full max-w-sm p-6 animate-slide-up shadow-[12px_12px_24px_#c2cbda,-12px_-12px_24px_#ffffff]">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">🗑️ Delete Customer Account</h3>
            <p className="text-[#8e98aa] text-sm mb-6 font-bold leading-relaxed">
              Are you sure you want to permanently delete customer account <strong>{deleteCustomerConfirm.username}</strong> ({deleteCustomerConfirm.email})? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCustomerConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                id="admin-confirm-delete-customer"
                onClick={handleDeleteCustomer}
                className="btn-danger flex-1 py-2.5 font-bold"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Enquiry Confirmation Modal */}
      {deleteEnquiryConfirm && (
        <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#e6eef8] rounded-3xl w-full max-w-sm p-6 animate-slide-up shadow-[12px_12px_24px_#c2cbda,-12px_-12px_24px_#ffffff]">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">🗑️ Delete Enquiry</h3>
            <p className="text-[#8e98aa] text-sm mb-6 font-bold leading-relaxed">
              Are you sure you want to permanently delete this enquiry from <strong>{deleteEnquiryConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEnquiryConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                id="admin-confirm-delete-enquiry"
                onClick={handleDeleteEnquiry}
                className="btn-danger flex-1 py-2.5 font-bold"
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
