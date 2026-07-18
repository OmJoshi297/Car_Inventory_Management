import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { vehiclesAPI, inventoryAPI } from '../api/client'
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

  useEffect(() => {
    vehiclesAPI.list().then(({ data }) => setVehicles(data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
    inventoryAPI.getPurchasesLogs().then(({ data }) => setLogs(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs()
    } else if (activeTab === 'inventory') {
      vehiclesAPI.list().then(({ data }) => setVehicles(data)).catch(() => {})
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
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="glass-card overflow-hidden">
          {activeTab === 'inventory' ? (
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
          ) : (
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
    </div>
  )
}
