import { useState } from 'react'

const CAR_PLACEHOLDER_IMAGES = {
  Sedan:       'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1000&q=80',
  SUV:         'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&q=80',
  Truck:       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=80',
  Electric:    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1000&q=80',
  Coupe:       'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1000&q=80',
  Van:         'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&q=80',
  Convertible: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&q=80',
  Pickup:      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1000&q=80',
}

export default function VehicleDetailsModal({ vehicle, onClose, onPurchase, onEdit, onDelete, onRestock, isAdmin, purchasing }) {
  if (!vehicle) return null

  const {
    id, make, model, year, category, price, quantity,
    color, mileage, description, image_url, image_urls
  } = vehicle

  const photos = Array.isArray(image_urls) && image_urls.length > 0
    ? image_urls
    : image_url
    ? [image_url]
    : [CAR_PLACEHOLDER_IMAGES[category] || CAR_PLACEHOLDER_IMAGES.Sedan]

  const [activeIdx, setActiveIdx] = useState(0)
  const isOutOfStock = quantity === 0

  const formatPrice = (p) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p)

  const formatMileage = (m) =>
    m === 0 ? 'New' : `${new Intl.NumberFormat('en-US').format(m)} miles`

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={onClose}>
      <div
        className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Images */}
        <div className="md:w-1/2 p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-700/50">
          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-700/30">
            <img
              src={photos[activeIdx]}
              alt={`${year} ${make} ${model}`}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = CAR_PLACEHOLDER_IMAGES.Sedan }}
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                <span className="bg-red-500 text-white text-base font-bold px-5 py-2.5 rounded-full shadow-lg">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Slider arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActiveIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setActiveIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnails grid */}
          {photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border bg-slate-900 transition-all duration-200 ${
                    idx === activeIdx ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = CAR_PLACEHOLDER_IMAGES.Sedan }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Information */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between gap-6 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex gap-2 items-center mb-2">
                <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1">
                  {category}
                </span>
                {vehicle.is_on_sale && vehicle.sale_price && (
                  <span className="badge bg-rose-600 text-white border-rose-500/30 text-xs font-bold px-3 py-1 flex items-center gap-1 uppercase tracking-wider animate-pulse">
                    🏷️ Sale Offer
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {year} {make} {model}
              </h2>
              <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                {vehicle.is_on_sale && vehicle.sale_price ? (
                  <>
                    <span className="text-3xl font-bold text-gradient">{formatPrice(vehicle.sale_price)}</span>
                    <span className="text-lg line-through text-slate-500 font-medium">{formatPrice(price)}</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gradient">{formatPrice(price)}</span>
                )}
              </div>
            </div>

            {/* Specifications grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900/40 rounded-xl p-4 border border-slate-800">
              <div>
                <p className="text-xs text-slate-400 font-medium">Mileage</p>
                <p className="text-sm font-semibold text-slate-200">{formatMileage(mileage)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Exterior Color</p>
                <p className="text-sm font-semibold text-slate-200">{color || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Available Inventory</p>
                <p className={`text-sm font-semibold ${isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>
                  {isOutOfStock ? 'Out of stock' : `${quantity} unit(s) left`}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Listing ID</p>
                <p className="text-sm font-semibold text-slate-500 font-mono">#{id}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Description</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/20 rounded-xl p-3 border border-slate-800/40">
                {description || 'No description provided for this vehicle.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-auto">
            {!isAdmin && (
              <button
                onClick={() => {
                  onPurchase(id)
                  onClose()
                }}
                disabled={isOutOfStock || purchasing}
                className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <span>Processing...</span>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  <>
                    <span>🛒 Purchase Vehicle</span>
                  </>
                )}
              </button>
            )}

            {isAdmin && (
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => {
                    onEdit(vehicle)
                    onClose()
                  }}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  ✏️ Edit Details
                </button>
                <button
                  onClick={() => {
                    onRestock(vehicle)
                    onClose()
                  }}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  📦 Restock Units
                </button>
                <button
                  onClick={() => {
                    onDelete(id)
                    onClose()
                  }}
                  className="btn-danger py-2 px-4 text-xs"
                >
                  🗑️ Delete Listing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
