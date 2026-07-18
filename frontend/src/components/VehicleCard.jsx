import { useState } from 'react'

const CATEGORY_COLORS = {
  Sedan:       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SUV:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Truck:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Coupe:       'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Van:         'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Electric:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Convertible: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Pickup:      'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

const CAR_PLACEHOLDER_IMAGES = {
  Sedan:       'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
  SUV:         'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
  Truck:       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  Electric:    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80',
  Coupe:       'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80',
  Van:         'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80',
  Convertible: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80',
  Pickup:      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=80',
}

export default function VehicleCard({ vehicle, onPurchase, onEdit, onDelete, onRestock, onViewDetails, isAdmin, purchasing }) {
  const {
    id, make, model, year, category, price, quantity,
    color, mileage, image_url, image_urls,
  } = vehicle

  const [activeImgIdx, setActiveImgIdx] = useState(0)

  const categoryColor = CATEGORY_COLORS[category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  const photos = Array.isArray(image_urls) && image_urls.length > 0
    ? image_urls
    : image_url
    ? [image_url]
    : [CAR_PLACEHOLDER_IMAGES[category] || CAR_PLACEHOLDER_IMAGES.Sedan]
  
  const imageUrl = photos[activeImgIdx] || CAR_PLACEHOLDER_IMAGES[category] || CAR_PLACEHOLDER_IMAGES.Sedan
  const isOutOfStock = quantity === 0

  const formatPrice = (p) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p)

  const formatMileage = (m) =>
    m === 0 ? 'New' : `${new Intl.NumberFormat('en-US').format(m)} mi`

  return (
    <div
      data-testid="vehicle-card"
      onClick={() => onViewDetails && onViewDetails(vehicle)}
      className="glass-card overflow-hidden group hover:border-indigo-500/40 hover:shadow-glow
                 transition-all duration-300 animate-slide-up flex flex-col cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-900">
        <img
          src={imageUrl}
          alt={`${year} ${make} ${model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = CAR_PLACEHOLDER_IMAGES.Sedan }}
        />

        {/* Carousel Navigation */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveImgIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-900/80 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveImgIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-900/80 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImgIdx(idx)
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    idx === activeImgIdx ? 'bg-indigo-500 w-3' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />

        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
            <span className="bg-red-500/90 text-white text-sm font-bold px-4 py-2 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Category & Sale badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className={`badge border ${categoryColor} text-xs font-semibold`}>
            {category}
          </span>
          {vehicle.is_on_sale && vehicle.sale_price && (
            <span className="badge bg-rose-600 text-white border-rose-500/30 text-[10px] font-bold px-2 py-0.5 shadow-md flex items-center gap-1 uppercase tracking-wider animate-pulse">
              🏷️ Sale
            </span>
          )}
        </div>

        {/* Quantity badge */}
        <div className="absolute top-3 right-3">
          <span className={`badge border text-xs font-semibold ${
            isOutOfStock
              ? 'bg-red-500/20 text-red-300 border-red-500/30'
              : quantity <= 2
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-green-500/20 text-green-300 border-green-500/30'
          }`}>
            {isOutOfStock ? '0 left' : `${quantity} left`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-white">
            {year} {make} {model}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            {color && (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                {color}
              </span>
            )}
            <span>{formatMileage(mileage)}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          {vehicle.is_on_sale && vehicle.sale_price ? (
            <>
              <span className="text-2xl font-bold text-gradient">{formatPrice(vehicle.sale_price)}</span>
              <span className="text-sm line-through text-slate-500 font-medium">{formatPrice(price)}</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-gradient">{formatPrice(price)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          {!isAdmin && (
            <button
              id={`purchase-btn-${id}`}
              data-testid="purchase-btn"
              disabled={isOutOfStock || purchasing}
              onClick={(e) => {
                e.stopPropagation()
                onPurchase(id)
              }}
              className="btn-primary w-full text-sm py-2.5"
            >
              {purchasing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Processing...
                </span>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : (
                '🛒 Purchase'
              )}
            </button>
          )}

          {isAdmin && (
            <div className="flex gap-2">
              <button
                id={`edit-btn-${id}`}
                data-testid="edit-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(vehicle)
                }}
                className="btn-secondary flex-1 text-xs py-2"
              >
                ✏️ Edit
              </button>
              <button
                id={`restock-btn-${id}`}
                data-testid="restock-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onRestock(vehicle)
                }}
                className="btn-secondary flex-1 text-xs py-2"
              >
                📦 Restock
              </button>
              <button
                id={`delete-btn-${id}`}
                data-testid="delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(id)
                }}
                className="btn-danger text-xs py-2 px-3"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
