import { useState } from 'react'

const CATEGORY_COLORS = {
  Sedan:       'text-sky-600 bg-[#e6eef8] border-sky-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
  SUV:         'text-emerald-600 bg-[#e6eef8] border-emerald-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
  Truck:       'text-amber-600 bg-[#e6eef8] border-amber-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
  Coupe:       'text-pink-600 bg-[#e6eef8] border-pink-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
  Van:         'text-cyan-600 bg-[#e6eef8] border-cyan-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
  Electric:    'text-violet-600 bg-[#e6eef8] border-violet-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
  Convertible: 'text-rose-600 bg-[#e6eef8] border-rose-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
  Pickup:      'text-orange-600 bg-[#e6eef8] border-orange-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]',
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

  const categoryColor = CATEGORY_COLORS[category] || 'text-slate-600 bg-[#e6eef8] border-slate-100 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]'
  const photos = Array.isArray(image_urls) && image_urls.length > 0
    ? image_urls
    : image_url ? [image_url]
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
      className="group relative bg-[#e6eef8] rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up
                 flex flex-col cursor-pointer p-3"
      style={{ boxShadow: '6px 6px 12px #c2cbda, -6px -6px 12px #ffffff' }}
    >
      {/* ── Image ── */}
      <div className="relative h-40 overflow-hidden bg-[#e6eef8] rounded-xl flex-shrink-0"
           style={{ boxShadow: 'inset 3px 3px 6px #c2cbda, inset -3px -3px 6px #ffffff' }}>
        <img
          src={imageUrl}
          alt={`${year} ${make} ${model}`}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out p-1 rounded-2xl"
          onError={(e) => { e.target.src = CAR_PLACEHOLDER_IMAGES.Sedan }}
        />

        {/* Carousel */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImgIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1)) }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#e6eef8] text-[#51576c] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImgIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1)) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#e6eef8] text-[#51576c] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* Out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#e6eef8]/75 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-[#e6eef8] text-red-500 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-[2px_2px_5px_#c2cbda,-2px_-2px_5px_#ffffff]">
              Out of Stock
            </span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          <span className={`badge border-0 text-[9px] font-bold ${categoryColor}`}>{category}</span>
          {vehicle.is_on_sale && vehicle.sale_price && (
            <span className="badge bg-[#e6eef8] text-red-500 border-0 text-[8px] font-extrabold uppercase tracking-widest shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]">
              SALE
            </span>
          )}
        </div>

        {/* Stock badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border-0 bg-[#e6eef8] ${
            isOutOfStock ? 'text-red-500 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]'
            : quantity <= 2 ? 'text-amber-600 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]'
            : 'text-emerald-600 shadow-[inset_1px_1px_3px_#c2cbda,inset_-1px_-1px_3px_#ffffff]'
          }`}>
            {isOutOfStock ? 'Sold out' : `${quantity} left`}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pt-3 px-1 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1d1d1f] leading-snug tracking-tight">
            {year} {make} {model}
          </h3>
          <div className="flex items-center gap-2.5 mt-1.5">
            {color && (
              <span className="text-[11px] text-[#51576c] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a1aabf] inline-block" />
                {color}
              </span>
            )}
            <span className="text-[11px] text-[#8e98aa] font-medium">{formatMileage(mileage)}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {vehicle.is_on_sale && vehicle.sale_price ? (
            <>
              <span className="text-lg font-extrabold text-[#0071e3]">{formatPrice(vehicle.sale_price)}</span>
              <span className="text-xs line-through text-[#8e98aa] font-medium">{formatPrice(price)}</span>
            </>
          ) : (
            <span className="text-lg font-extrabold text-[#1d1d1f]">{formatPrice(price)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          {!isAdmin && (
            <button
              id={`purchase-btn-${id}`}
              data-testid="purchase-btn"
              onClick={(e) => { e.stopPropagation(); onPurchase(id) }}
              disabled={purchasing || isOutOfStock}
              className={`flex-1 text-xs py-2.5 font-bold rounded-xl transition-all duration-150 ${
                isOutOfStock
                  ? 'bg-transparent text-[#b0bacd] border border-[#d8e0ed] cursor-not-allowed shadow-none'
                  : 'bg-[#e6eef8] text-[#0071e3] shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_3px_#c2cbda,-1px_-1px_3px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]'
              }`}
            >
              {purchasing ? 'Processing...' : isOutOfStock ? 'Unavailable' : 'Purchase'}
            </button>
          )}

          {isAdmin && (
            <div className="flex gap-1.5 w-full">
              <button
                id={`edit-btn-${id}`}
                data-testid="edit-btn"
                onClick={(e) => { e.stopPropagation(); onEdit(vehicle) }}
                className="flex-1 text-[11px] py-2 font-semibold bg-[#e6eef8] text-[#1d1d1f] rounded-xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_2.5px_2.5px_5px_#c2cbda,inset_-2.5px_-2.5px_5px_#ffffff] transition-all duration-150"
              >
                Edit
              </button>
              <button
                id={`restock-btn-${id}`}
                data-testid="restock-btn"
                onClick={(e) => { e.stopPropagation(); onRestock(vehicle) }}
                className="flex-1 text-[11px] py-2 font-semibold bg-[#e6eef8] text-[#1d1d1f] rounded-xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_2.5px_2.5px_5px_#c2cbda,inset_-2.5px_-2.5px_5px_#ffffff] transition-all duration-150"
              >
                Restock
              </button>
              <button
                id={`delete-btn-${id}`}
                data-testid="delete-btn"
                onClick={(e) => { e.stopPropagation(); onDelete(id) }}
                className="text-[11px] py-2 px-3 font-semibold bg-[#e6eef8] text-red-500 rounded-xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_2.5px_2.5px_5px_#c2cbda,inset_-2.5px_-2.5px_5px_#ffffff] transition-all duration-150"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
