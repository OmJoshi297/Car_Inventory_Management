import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { vehiclesAPI, inventoryAPI, enquiriesAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import VehicleCard from '../components/VehicleCard'
import SearchBar from '../components/SearchBar'
import VehicleForm from '../components/VehicleForm'
import VehicleDetailsModal from '../components/VehicleDetailsModal'
import EnquiryModal from '../components/EnquiryModal'

export default function Dashboard() {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchActive, setSearchActive] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [purchasing, setPurchasing] = useState({})
  const [showSupportChat, setShowSupportChat] = useState(false)
  const [showRestock, setShowRestock] = useState(null)
  const [restockQty, setRestockQty] = useState(5)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerTab, setDrawerTab] = useState('acquisitions')
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [myEnquiries, setMyEnquiries] = useState([])
  const [myEnquiriesLoading, setMyEnquiriesLoading] = useState(false)

  const [trends, setTrends] = useState({ most_selling: [], on_sale: [] })
  const [trendsLoading, setTrendsLoading] = useState(true)
  const [activeTrendTab, setActiveTrendTab] = useState('trending')

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

  const fetchMyEnquiries = useCallback(async () => {
    if (!isAuthenticated) return
    setMyEnquiriesLoading(true)
    try {
      const { data } = await enquiriesAPI.listMy()
      setMyEnquiries(data)
    } catch {
      toast.error('Failed to load your enquiries')
    } finally {
      setMyEnquiriesLoading(false)
    }
  }, [isAuthenticated])

  const toggleDrawer = () => {
    const nextState = !showDrawer
    setShowDrawer(nextState)
    if (nextState) {
      if (isAdmin) {
        fetchLogs()
      } else {
        fetchLogs()
        fetchMyEnquiries()
      }
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

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true)
    try {
      const { data } = await vehiclesAPI.getTrends()
      setTrends(data)
    } catch {
      toast.error('Failed to load vehicle trends')
    } finally {
      setTrendsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchTrends()
  }, [fetchAll, fetchTrends])

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
    if (isAdmin) {
      toast.error('Administrators are not allowed to purchase vehicles.')
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
      fetchTrends()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Purchase failed')
    } finally {
      setPurchasing((p) => ({ ...p, [id]: false }))
    }
  }

  const handleEnquirySubmit = async (payload) => {
    setEnquiryLoading(true)
    try {
      await enquiriesAPI.create(payload)
      toast.success('Enquiry submitted successfully! We will get back to you soon. ✅')
      setEnquiryVehicle(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit enquiry')
    } finally {
      setEnquiryLoading(false)
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
      fetchTrends()
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
      fetchTrends()
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
      fetchTrends()
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
        {/* Featured Trends and Deals Section */}
        <div className="glass-card p-6 border border-slate-700/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                ✨ Featured Collections
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Explore our best sellers and limited-time discounts
              </p>
            </div>
            {/* Tab buttons */}
            <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTrendTab('trending')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                  activeTrendTab === 'trending'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔥 Trending Now
              </button>
              <button
                onClick={() => setActiveTrendTab('deals')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                  activeTrendTab === 'deals'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏷️ Special Offers
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {trendsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card h-72 animate-pulse">
                  <div className="h-40 bg-slate-700/40 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-700/40 rounded w-3/4" />
                    <div className="h-3 bg-slate-700/40 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTrendTab === 'trending' ? (
                trends.most_selling.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-4xl mb-2">🔥</p>
                    <p className="font-semibold text-sm">No trending vehicles yet</p>
                    <p className="text-xs mt-1">Purchased vehicles will start trending here!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trends.most_selling.map((v) => (
                      <VehicleCard
                        key={`trend-${v.id}`}
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
                )
              ) : (
                trends.on_sale.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-4xl mb-2">🏷️</p>
                    <p className="font-semibold text-sm">No special offers at the moment</p>
                    <p className="text-xs mt-1">Check back later for exciting discounts!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trends.on_sale.map((v) => (
                      <VehicleCard
                        key={`deal-${v.id}`}
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
                )
              )}
            </>
          )}
        </div>

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
                  {isAdmin ? '📜 Purchase Logs' : '📜 Purchase History'}
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

      {/* Vehicle Support Chat Modal */}
      {showSupportChat && (
        <EnquiryModal
          user={user}
          onClose={() => {
            setShowSupportChat(false)
            fetchMyEnquiries()
          }}
        />
      )}

      {/* Sliding Drawer for Purchase History & Enquiries */}
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
                  {isAdmin ? '📜 Purchase Logs' : '📜 Activity Center'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdmin ? 'System-wide logs (Admin view)' : 'Your recent dealer updates'}
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

            {!isAdmin && (
              <div className="flex border-b border-slate-800/80 px-6 py-2 gap-4 bg-slate-950/20">
                <button
                  onClick={() => setDrawerTab('acquisitions')}
                  className={`pb-2.5 text-xs font-semibold relative transition-all ${
                    drawerTab === 'acquisitions' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📜 Acquisitions
                  {drawerTab === 'acquisitions' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setDrawerTab('enquiries')}
                  className={`pb-2.5 text-xs font-semibold relative transition-all ${
                    drawerTab === 'enquiries' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✉️ My Enquiries ({myEnquiries.length})
                  {drawerTab === 'enquiries' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isAdmin || drawerTab === 'acquisitions' ? (
                logsLoading ? (
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
                )
              ) : (
                myEnquiriesLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-800" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : myEnquiries.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <p className="text-5xl mb-4">✉️</p>
                    <p className="font-semibold text-slate-300">No enquiries found</p>
                    <p className="text-xs mt-1">Queries you submit about cars will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myEnquiries.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          setEnquiryVehicle({
                            id: e.vehicle_id,
                            make: e.vehicle_make,
                            model: e.vehicle_model
                          })
                          setShowDrawer(false)
                        }}
                        className="glass-card p-4 hover:border-indigo-500/40 hover:scale-[1.01] cursor-pointer transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-bold text-sm text-slate-200">
                            {e.vehicle_id ? `${e.vehicle_make} ${e.vehicle_model}` : 'General Enquiry'}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(e.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-slate-300 bg-slate-950/20 p-2.5 rounded-lg border border-slate-800/40 leading-relaxed mb-3">
                          <strong className="text-slate-400 block mb-0.5 text-[10px]">Initial Enquiry:</strong>
                          {e.message}
                        </div>

                        <div className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 w-fit flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-pulse" />
                          Open 2-Way Chat Room
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
      {/* Floating Chat Support Widget */}
      {!isAdmin && (
        <button
          id="floating-support-chat-btn"
          onClick={() => setShowSupportChat(true)}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 border border-indigo-500/35"
          title="Open Live Chat Support"
        >
          <span className="text-xl">💬</span>
          <span className="text-xs uppercase tracking-wider font-semibold">Live Support</span>
        </button>
      )}
    </div>
  )
}
