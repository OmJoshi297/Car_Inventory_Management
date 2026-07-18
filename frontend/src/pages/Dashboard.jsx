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
      setShowForm(false);
      setEditVehicle(null);
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

  return (
    <div className="min-h-screen bg-[#e6eef8] py-4">

      {/* ── Hero / Top bar ── */}
      <div className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 bg-[#e6eef8] p-8 sm:p-10 mb-8 border border-[#d8e0ed]"
           style={{ boxShadow: '6px 6px 12px #c2cbda, -6px -6px 12px #ffffff' }}>
        {/* Grid texture */}
        <div className="absolute inset-0 grid-texture opacity-30" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

            {/* Title */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#e6eef8] px-3 py-1 mb-4 rounded-full shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                <span className="text-[11px] text-[#0071e3] font-bold tracking-widest uppercase">
                  {searchActive ? 'Search Results' : 'Live Inventory'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1f] tracking-tight leading-none">
                Vehicle <span className="text-gradient">Inventory</span>
              </h1>
              <p className="text-sm text-[#8e98aa] mt-2.5 font-bold">
                {searchActive ? 'Showing filtered results' : 'Browse our curated collection of premium vehicles'}
              </p>
            </div>

            {/* Stats + Actions */}
            <div className="flex flex-col gap-4 items-start sm:items-end">
              {/* Stats */}
              <div className="flex items-center gap-3">
                {[
                  { label: 'Listings', value: totalVehicles },
                  { label: 'In Stock', value: inStock },
                  { label: 'Out of Stock', value: outOfStock },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center px-4 py-2.5 bg-[#e6eef8] rounded-2xl min-w-[72px] shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff]">
                    <span className="text-base font-extrabold text-[#1d1d1f] leading-none">{value}</span>
                    <span className="text-[10px] text-[#8e98aa] mt-1.5 whitespace-nowrap font-bold">{label}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <button
                    id="view-logs-btn"
                    onClick={toggleDrawer}
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {isAdmin ? 'Purchase Logs' : 'History'}
                  </button>
                )}
                {isAdmin && (
                  <button
                    id="add-vehicle-btn"
                    onClick={() => { setEditVehicle(null); setShowForm(true) }}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    + Add Vehicle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">

        {/* Featured Collections */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-px h-4 bg-[#0071e3] rounded-full" />
              <span className="text-xs font-bold text-[#8e98aa] uppercase tracking-widest">Featured</span>
            </div>
            <div className="flex gap-2 bg-[#e6eef8] p-1.5 rounded-xl shadow-[inset_2.5px_2.5px_5px_#c2cbda,inset_-2.5px_-2.5px_5px_#ffffff]">
              <button
                onClick={() => setActiveTrendTab('trending')}
                className={activeTrendTab === 'trending' ? 'tab-pill-active' : 'tab-pill-inactive'}
              >
                🔥 Trending
              </button>
              <button
                onClick={() => setActiveTrendTab('deals')}
                className={activeTrendTab === 'deals' ? 'tab-pill-active' : 'tab-pill-inactive'}
              >
                🏷️ On Sale
              </button>
            </div>
          </div>

          {trendsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#e6eef8] rounded-2xl h-64" style={{ boxShadow: '6px 6px 12px #c2cbda, -6px -6px 12px #ffffff' }}>
                  <div className="h-36 shimmer rounded-t-2xl" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3 shimmer rounded-md w-3/4" />
                    <div className="h-2.5 shimmer rounded-md w-1/2" />
                    <div className="h-8 shimmer rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTrendTab === 'trending' ? (
                trends.most_selling.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-[#cbd3e2] rounded-2xl">
                    <p className="text-2xl mb-2">🔥</p>
                    <p className="text-sm font-bold text-[#8e98aa]">No trending vehicles yet</p>
                    <p className="text-xs text-[#aeb5c2] mt-1 font-medium">Purchased vehicles will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {trends.most_selling.map((v) => (
                      <VehicleCard key={`trend-${v.id}`} vehicle={v} isAdmin={isAdmin}
                        purchasing={purchasing[v.id]} onPurchase={handlePurchase}
                        onEdit={handleEdit} onDelete={handleDelete} onRestock={setShowRestock}
                        onViewDetails={(car) => setSelectedVehicle(car)} />
                    ))}
                  </div>
                )
              ) : (
                trends.on_sale.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-[#cbd3e2] rounded-2xl">
                    <p className="text-2xl mb-2">🏷️</p>
                    <p className="text-sm font-bold text-[#8e98aa]">No special offers right now</p>
                    <p className="text-xs text-[#aeb5c2] mt-1 font-medium">Check back later for discounts</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {trends.on_sale.map((v) => (
                      <VehicleCard key={`deal-${v.id}`} vehicle={v} isAdmin={isAdmin}
                        purchasing={purchasing[v.id]} onPurchase={handlePurchase}
                        onEdit={handleEdit} onDelete={handleDelete} onRestock={setShowRestock}
                        onViewDetails={(car) => setSelectedVehicle(car)} />
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </section>

        {/* Section divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#c2cbda] to-transparent" />
        </div>

        {/* All Vehicles */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-px h-4 bg-[#0071e3] rounded-full" />
              <span className="text-xs font-bold text-[#8e98aa] uppercase tracking-widest">
                {loading ? 'Loading...' : `All Vehicles · ${vehicles.length}`}
              </span>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} />
        </section>

        {/* Vehicle grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#e6eef8] rounded-2xl h-64" style={{ boxShadow: '6px 6px 12px #c2cbda, -6px -6px 12px #ffffff' }}>
                <div className="h-36 shimmer rounded-t-2xl" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 shimmer rounded-md w-3/4" />
                  <div className="h-2.5 shimmer rounded-md w-1/2" />
                  <div className="h-8 shimmer rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-24 animate-fade-in rounded-3xl bg-[#e6eef8] shadow-[inset_4px_4px_8px_#c2cbda,inset_-4px_-4px_8px_#ffffff]">
            <div className="text-4xl mb-4">🚘</div>
            <p className="text-sm font-bold text-[#8e98aa]">No vehicles found</p>
            <p className="text-xs text-[#aeb5c2] mt-1.5 font-medium">
              {searchActive ? 'Try adjusting your search filters' : 'No vehicles in inventory yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} isAdmin={isAdmin}
                purchasing={purchasing[v.id]} onPurchase={handlePurchase}
                onEdit={handleEdit} onDelete={handleDelete} onRestock={setShowRestock}
                onViewDetails={(car) => setSelectedVehicle(car)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Vehicle Form Modal ── */}
      {showForm && (
        <VehicleForm vehicle={editVehicle} loading={formLoading}
          onSubmit={handleFormSubmit} onClose={() => { setShowForm(false); setEditVehicle(null) }} />
      )}

      {/* ── Restock Modal ── */}
      {showRestock && (
        <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#e6eef8] rounded-2xl w-full max-w-sm p-6 animate-slide-up" style={{ boxShadow: '10px 10px 20px #c2cbda, -10px -10px 20px #ffffff' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] flex items-center justify-center text-[#0071e3] text-sm">📦</div>
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f]">Restock Vehicle</h3>
                <p className="text-[11px] text-[#8e98aa] mt-0.5 font-semibold">
                  {showRestock.year} {showRestock.make} {showRestock.model} · {showRestock.quantity} units
                </p>
              </div>
            </div>
            <label className="block text-[11px] text-[#8e98aa] font-bold mb-2 uppercase tracking-wider">Units to add</label>
            <input
              id="restock-qty-input" type="number" min="1" value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              className="form-input mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRestock(null)} className="btn-secondary flex-1">Cancel</button>
              <button id="confirm-restock-btn" onClick={handleRestock} className="btn-primary flex-1">Confirm Restock</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#e6eef8] rounded-2xl w-full max-w-sm p-6 animate-slide-up" style={{ boxShadow: '10px 10px 20px #c2cbda, -10px -10px 20px #ffffff' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] flex items-center justify-center text-red-500 text-sm">🗑️</div>
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f]">Delete Vehicle</h3>
                <p className="text-[11px] text-[#8e98aa] mt-0.5 font-semibold">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-[#8e98aa] mb-5 bg-[#e6eef8] p-3 rounded-xl shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] leading-relaxed">
              Permanently remove <strong className="text-[#1d1d1f]">{deleteConfirm.year} {deleteConfirm.make} {deleteConfirm.model}</strong> from inventory?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button id="confirm-delete-btn" onClick={handleConfirmDelete}
                className="flex-1 btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vehicle Details Modal ── */}
      {selectedVehicle && (
        <VehicleDetailsModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)}
          onPurchase={handlePurchase} onEdit={handleEdit} onDelete={handleDelete}
          onRestock={setShowRestock} isAdmin={isAdmin} purchasing={purchasing[selectedVehicle.id]} />
      )}

      {/* ── Support Chat Modal ── */}
      {showSupportChat && (
        <EnquiryModal user={user} onClose={() => { setShowSupportChat(false); fetchMyEnquiries() }} />
      )}

      {/* ── Sliding Drawer ── */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-black/10 animate-fade-in" onClick={() => setShowDrawer(false)} />
          <div className="relative w-full max-w-sm h-full bg-[#e6eef8] border-l border-[#cbd3e2] flex flex-col z-10 animate-slide-left p-4">
            {/* Drawer header */}
            <div className="px-4 py-4 rounded-2xl shadow-[4px_4px_8px_#c2cbda,-4px_-4px_8px_#ffffff] flex items-center justify-between bg-[#e6eef8] mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f]">{isAdmin ? 'Purchase Logs' : 'Activity Center'}</h3>
                <p className="text-[11px] text-[#8e98aa] mt-0.5 font-semibold">
                  {isAdmin ? 'All system transactions' : 'Your purchases & support threads'}
                </p>
              </div>
              <button onClick={() => setShowDrawer(false)}
                className="text-[#8e98aa] hover:text-[#1d1d1f] p-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!isAdmin && (
              <div className="flex p-1.5 rounded-2xl shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] bg-[#e6eef8] mb-4 gap-2">
                {[
                  { key: 'acquisitions', label: 'Purchases' },
                  { key: 'enquiries', label: `Enquiries${myEnquiries.length > 0 ? ` · ${myEnquiries.length}` : ''}` },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setDrawerTab(key)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      drawerTab === key
                        ? 'text-[#0071e3] shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]'
                        : 'text-[#8e98aa] hover:text-[#1d1d1f]'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              {isAdmin || drawerTab === 'acquisitions' ? (
                logsLoading
                  ? [...Array(4)].map((_, i) => (
                    <div key={i} className="bg-[#e6eef8] rounded-xl h-16 shimmer shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff]" />
                  ))
                  : logs.length === 0
                  ? (
                    <div className="text-center py-20 text-[#8e98aa]">
                      <p className="text-2xl mb-2">🛒</p>
                      <p className="text-sm font-semibold">No purchases found</p>
                      <p className="text-xs mt-1 font-medium">Acquired vehicles show here</p>
                    </div>
                  )
                  : logs.map((log) => (
                    <div key={log.id} className="bg-[#e6eef8] rounded-xl p-4 transition-all shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-[#1d1d1f]">{log.vehicle_make} {log.vehicle_model}</p>
                          <p className="text-[11px] text-[#8e98aa] mt-0.5 font-semibold">Qty: {log.quantity}</p>
                        </div>
                        <span className="text-xs font-extrabold text-[#0071e3]">₹{log.total_price.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-[#d8e0ed]">
                        <span className="text-[10px] text-[#8e98aa] font-medium">{new Date(log.created_at).toLocaleDateString()}</span>
                        {isAdmin && <span className="text-[10px] text-[#8e98aa] font-medium">{log.username}</span>}
                      </div>
                    </div>
                  ))
              ) : (
                myEnquiriesLoading
                  ? [...Array(4)].map((_, i) => (
                    <div key={i} className="bg-[#e6eef8] rounded-xl h-16 shimmer shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff]" />
                  ))
                  : myEnquiries.length === 0
                  ? (
                    <div className="text-center py-20 text-[#8e98aa]">
                      <p className="text-2xl mb-2">💬</p>
                      <p className="text-sm font-semibold">No enquiries yet</p>
                      <p className="text-xs mt-1 font-medium">Use the chat button to get started</p>
                    </div>
                  )
                  : myEnquiries.map((e) => (
                    <div key={e.id}
                      onClick={() => { setShowSupportChat(true); setShowDrawer(false) }}
                      className="bg-[#e6eef8] rounded-xl p-4 cursor-pointer transition-all shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_2px_#c2cbda,-1px_-1px_2px_#ffffff]">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-[#1d1d1f]">Support Thread</p>
                        <span className="text-[10px] text-[#8e98aa] font-medium">{new Date(e.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-[#8e98aa] truncate font-medium">{e.message}</p>
                      <span className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] text-[#0071e3] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                        Open Chat
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Live Support Button ── */}
      {!isAdmin && (
        <button
          id="floating-support-chat-btn"
          onClick={() => setShowSupportChat(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#e6eef8] text-[#0071e3] text-xs font-bold
                     py-3.5 px-5 rounded-full shadow-[5px_5px_10px_#c2cbda,-5px_-5px_10px_#ffffff]
                     hover:shadow-[2px_2px_5px_#c2cbda,-2px_-2px_5px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]
                     transition-all duration-200 active:scale-95 flex items-center gap-2 border border-[#d8e0ed]"
          title="Open Live Chat Support"
        >
          <svg className="w-4 h-4 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Live Support
        </button>
      )}
    </div>
  )
}