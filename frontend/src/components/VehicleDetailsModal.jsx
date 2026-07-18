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
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p)

  const formatMileage = (m) =>
    m === 0 ? 'New' : `${new Intl.NumberFormat('en-US').format(m)} miles`

  return (
    <div
      className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#e6eef8] w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up flex flex-col md:flex-row rounded-3xl p-5 gap-5"
        style={{ boxShadow: '12px 12px 24px #c2cbda, -12px -12px 24px #ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Images */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#e6eef8] p-1.5 shadow-[inset_3px_3px_6px_#c2cbda,inset_-3px_-3px_6px_#ffffff]">
            <img
              src={photos[activeIdx]}
              alt={`${year} ${make} ${model}`}
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => { e.target.src = CAR_PLACEHOLDER_IMAGES.Sedan }}
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-[#e6eef8]/70 flex items-center justify-center">
                <span className="bg-[#e6eef8] text-red-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-[2px_2px_5px_#c2cbda,-2px_-2px_5px_#ffffff]">
                  Out of Stock
                </span>
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActiveIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#e6eef8] text-[#51576c] flex items-center justify-center hover:bg-white transition-all shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setActiveIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#e6eef8] text-[#51576c] flex items-center justify-center hover:bg-white transition-all shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`aspect-square rounded-xl overflow-hidden bg-[#e6eef8] p-1 transition-all duration-150 ${
                    idx === activeIdx
                      ? 'shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] border border-[#0071e3]/30'
                      : 'shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => { e.target.src = CAR_PLACEHOLDER_IMAGES.Sedan }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 flex flex-col justify-between gap-5 relative p-2">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-1 right-1 text-[#8e98aa] hover:text-[#1d1d1f] transition-all p-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex gap-2 items-center mb-2">
                <span className="badge text-[10px] font-bold text-[#51576c]">
                  {category}
                </span>
                {vehicle.is_on_sale && vehicle.sale_price && (
                  <span className="badge text-[10px] font-extrabold text-red-500 uppercase tracking-wider">
                    Sale
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-[#1d1d1f] leading-tight">
                {year} {make} {model}
              </h2>
              <div className="flex items-baseline gap-2 mt-2">
                {vehicle.is_on_sale && vehicle.sale_price ? (
                  <>
                    <span className="text-2xl font-extrabold text-[#0071e3]">{formatPrice(vehicle.sale_price)}</span>
                    <span className="text-sm line-through text-[#8e98aa] font-semibold">{formatPrice(price)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-extrabold text-[#1d1d1f]">{formatPrice(price)}</span>
                )}
              </div>
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Mileage', value: formatMileage(mileage) },
                { label: 'Color', value: color || 'N/A' },
                { label: 'Stock', value: isOutOfStock ? 'Out of stock' : `${quantity} units`, accent: isOutOfStock ? 'text-red-500' : 'text-emerald-600' },
                { label: 'ID', value: `#${id}`, mono: true },
              ].map(({ label, value, accent, mono }) => (
                <div key={label} className="bg-[#e6eef8] rounded-xl p-3 shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]">
                  <p className="text-[10px] text-[#8e98aa] font-bold mb-0.5">{label}</p>
                  <p className={`text-xs font-bold ${accent || 'text-[#1d1d1f]'} ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {description && (
              <div>
                <p className="text-[10px] text-[#8e98aa] font-bold uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-xs text-[#51576c] leading-relaxed bg-[#e6eef8] rounded-xl p-3 shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] font-medium">
                  {description}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-auto">
            {!isAdmin && (
              <button
                onClick={() => { onPurchase(id); onClose() }}
                disabled={isOutOfStock || purchasing}
                className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all duration-150 ${
                  isOutOfStock
                    ? 'bg-transparent text-[#b0bacd] border border-[#d8e0ed] cursor-not-allowed shadow-none'
                    : 'bg-[#e6eef8] text-[#0071e3] shadow-[4px_4px_8px_#c2cbda,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]'
                }`}
              >
                {purchasing ? 'Processing...' : isOutOfStock ? 'Unavailable' : 'Purchase Vehicle'}
              </button>
            )}

            {isAdmin && (
              <div className="flex gap-2.5">
                <button
                  onClick={() => { onEdit(vehicle); onClose() }}
                  className="flex-1 text-xs py-2 bg-[#e6eef8] text-[#1d1d1f] rounded-xl shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_3px_#c2cbda,-1px_-1px_3px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] transition-all duration-150 font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onRestock(vehicle); onClose() }}
                  className="flex-1 text-xs py-2 bg-[#e6eef8] text-[#1d1d1f] rounded-xl shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_3px_#c2cbda,-1px_-1px_3px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] transition-all duration-150 font-semibold"
                >
                  Restock
                </button>
                <button
                  onClick={() => { onDelete(id); onClose() }}
                  className="text-xs py-2 px-4 bg-[#e6eef8] text-red-500 rounded-xl shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_3px_#c2cbda,-1px_-1px_3px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff] transition-all duration-150 font-semibold"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
