import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { vehiclesAPI, inventoryAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import VehicleCard from '../components/VehicleCard'
import SearchBar from '../components/SearchBar'
import VehicleForm from '../components/VehicleForm'
import VehicleDetailsModal from '../components/VehicleDetailsModal'

export default function Dashboard() {
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchActive, setSearchActive] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [purchasing, setPurchasing] = useState({})
  const [showRestock, setShowRestock] = useState(null)
  const [restockQty, setRestockQty] = useState(5)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  const [showDrawer, setShowDrawer] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const { data } = await inventoryAPI.getPurchasesLogs()
      setLogs(data)
    } catch {
      toast.error('Failed to load purchase history')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  const toggleDrawer = () => {
    const nextState = !showDrawer
    setShowDrawer(nextState)
    if (nextState) {
      fetchLogs()
    }
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setSearchActive(false)
    try {
      const { data } = await vehiclesAPI.list()
      setVehicles(data)
    } catch {
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSearch = useCallback(async (params) => {
    if (!Object.keys(params).length) { fetchAll(); return }
    setLoading(true)
    setSearchActive(true)
    try {
      const { data } = await vehiclesAPI.search(params)
      setVehicles(data)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }, [fetchAll])

  const handlePurchase = async (id) => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase vehicles.')
      navigate('/login')
      return
    }
    setPurchasing((p) => ({ ...p, [id]: true }))
    try {
      const { data } = await inventoryAPI.purchase(id)
      toast.success(data.message)
      setVehicles((prev) =>
        prev.map((v) => v.id === id ? { ...v, quantity: data.new_quantity } : v)
      )
      fetchLogs()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Purchase failed')
    } finally {
      setPurchasing((p) => ({ ...p, [id]: false }))
    }
  }

  const handleEdit = (vehicle) => { setEditVehicle(vehicle); setShowForm(true) }

  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    try {
      if (editVehicle) {
        const { data } = await vehiclesAPI.update(editVehicle.id, payload)
        setVehicles((prev) => prev.map((v) => v.id === editVehicle.id ? data : v))
        toast.success('Vehicle updated! ✅')
      } else {
        const { data } = await vehiclesAPI.create(payload)
        setVehicles((prev) => [data, ...prev])
        toast.success('Vehicle added! 🚗')
      }
      setShowForm(false)
      setEditVehicle(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = (id) => {
    const v = vehicles.find(item => item.id === id)
    if (v) {
      setDeleteConfirm(v)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await vehiclesAPI.delete(deleteConfirm.id)
      setVehicles((prev) => prev.filter((v) => v.id !== deleteConfirm.id))
      toast.success('Vehicle deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleRestock = async () => {
    if (!showRestock) return
    try {
      const { data } = await inventoryAPI.restock(showRestock.id, restockQty)
      setVehicles((prev) =>
        prev.map((v) => v.id === showRestock.id ? { ...v, quantity: data.new_quantity } : v)
      )
      toast.success(data.message)
      setShowRestock(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Restock failed')
    }
  }

  // Stats
  const totalVehicles = vehicles.length
  const inStock = vehicles.filter((v) => v.quantity > 0).length
  const outOfStock = vehicles.filter((v) => v.quantity === 0).length
  const avgPrice = vehicles.length
    ? Math.round(vehicles.reduce((s, v) => s + v.price, 0) / vehicles.length)
    : 0

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative overflow-hidden py-12 px-4"
           style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
            Vehicle <span className="text-gradient">Inventory</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            {searchActive ? `Showing search results` : `Browse our premium collection`}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: totalVehicles, icon: '🚗' },
              { label: 'In Stock', value: inStock, icon: '✅' },
              { label: 'Out of Stock', value: outOfStock, icon: '⛔' },
              { label: 'Avg. Price', value: `$${avgPrice.toLocaleString()}`, icon: '💰' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="stat-card">
                <p className="text-2xl">{icon}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search + Add */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-slate-300">
              {loading ? 'Loading...' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} found`}
            </h2>
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button
                  id="view-logs-btn"
                  onClick={toggleDrawer}
                  className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2 border border-slate-700 hover:border-indigo-500"
                >
                  📜 Purchase History
                </button>
              )}
              {isAdmin && (
                <button
                  id="add-vehicle-btn"
                  onClick={() => { setEditVehicle(null); setShowForm(true) }}
                  className="btn-primary text-sm py-2.5"
                >
                  + Add Vehicle
                </button>
              )}
            </div>
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Vehicle grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card h-80 animate-pulse">
                <div className="h-48 bg-slate-700/50 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                  <div className="h-8 bg-slate-700/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-6xl mb-4">🚘</p>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No vehicles found</h3>
            <p className="text-slate-400">
              {searchActive ? 'Try adjusting your search filters' : 'No vehicles in inventory yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                isAdmin={isAdmin}
                purchasing={purchasing[v.id]}
                onPurchase={handlePurchase}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestock={setShowRestock}
                onViewDetails={(car) => setSelectedVehicle(car)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Form Modal */}
      {showForm && (
        <VehicleForm
          vehicle={editVehicle}
          loading={formLoading}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditVehicle(null) }}
        />
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-1">📦 Restock Vehicle</h3>
            <p className="text-slate-400 text-sm mb-5">
              {showRestock.year} {showRestock.make} {showRestock.model} — currently {showRestock.quantity} units
            </p>
            <label className="block text-xs text-slate-400 mb-2 font-medium">Units to add</label>
            <input
              id="restock-qty-input"
              type="number"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              className="form-input mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRestock(null)} className="btn-secondary flex-1">Cancel</button>
              <button id="confirm-restock-btn" onClick={handleRestock} className="btn-primary flex-1">
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
                id="confirm-delete-btn"
                onClick={handleConfirmDelete}
                className="btn-danger flex-1 py-2 font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onPurchase={handlePurchase}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestock={setShowRestock}
          isAdmin={isAdmin}
          purchasing={purchasing[selectedVehicle.id]}
        />
      )}

      {/* Sliding Drawer for Purchase History */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setShowDrawer(false)}
          />
          {/* Drawer content */}
          <div className="relative w-full max-w-md h-full bg-slate-900/95 border-l border-slate-700/50 shadow-2xl flex flex-col z-10 animate-slide-left">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  📜 Purchase History
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdmin ? 'System-wide logs (Admin view)' : 'Your recent vehicle acquisitions'}
                </p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {logsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : logs.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <p className="text-5xl mb-4">🛒</p>
                  <p className="font-semibold text-slate-300">No purchases found</p>
                  <p className="text-xs mt-1">Acquired vehicles will show up here.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-800 pl-4 space-y-6">
                  {logs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[24px] top-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 border-2 border-slate-900 shadow-glow" />
                      
                      <div className="glass-card p-4 hover:border-indigo-500/40 transition-all duration-200">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-slate-200">
                            {log.vehicle_make} {log.vehicle_model}
                          </h4>
                          <span className="text-xs text-indigo-400 font-bold">
                            ${log.total_price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                          <span>Qty: {log.quantity}</span>
                          <span>{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        {isAdmin && (
                          <div className="mt-2 pt-2 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                            <span>User: {log.username}</span>
                            <span className="text-indigo-500/80 bg-indigo-500/10 px-1.5 py-0.5 rounded">Admin View</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
