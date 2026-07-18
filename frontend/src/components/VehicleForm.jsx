import { useState, useEffect } from 'react'

const CATEGORIES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Van', 'Electric', 'Convertible', 'Pickup']

const EMPTY_FORM = {
  make: '', model: '', year: new Date().getFullYear(),
  category: 'Sedan', price: '', quantity: 1,
  description: '', image_urls: [''], color: '', mileage: 0,
  is_on_sale: false, sale_price: '',
}

export default function VehicleForm({ vehicle, onSubmit, onClose, loading }) {
  const isEdit = !!vehicle

  const toFormState = (v) => {
    if (!v) return { ...EMPTY_FORM, image_urls: [''] }
    return {
      ...v,
      is_on_sale: v.is_on_sale ?? false,
      sale_price: v.sale_price ?? '',
      image_urls: Array.isArray(v.image_urls) && v.image_urls.length > 0 
        ? [...v.image_urls]
        : v.image_url ? [v.image_url] : [''],
    }
  }

  const [form, setForm] = useState(() => toFormState(vehicle))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(toFormState(vehicle))
    setErrors({})
  }, [vehicle])

  const validate = () => {
    const e = {}
    if (!form.make.trim()) e.make = 'Make is required'
    if (!form.model.trim()) e.model = 'Model is required'
    if (!form.year || form.year < 1900 || form.year > 2030) e.year = 'Year must be 1900–2030'
    if (!form.price || Number(form.price) <= 0) e.price = 'Price must be positive'
    if (form.quantity < 0) e.quantity = 'Quantity cannot be negative'
    
    if (form.is_on_sale) {
      if (!form.sale_price || Number(form.sale_price) <= 0) {
        e.sale_price = 'Sale price is required'
      } else if (Number(form.sale_price) >= Number(form.price)) {
        e.sale_price = 'Sale price must be less than original price'
      }
    }
    return e
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleImageUrlChange = (idx, val) => {
    const next = [...form.image_urls]
    next[idx] = val
    setForm((prev) => ({ ...prev, image_urls: next }))
  }

  const addImageUrlField = () => {
    setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, ''] }))
  }

  const removeImageUrlField = (idx) => {
    setForm((prev) => {
      const next = prev.image_urls.filter((_, i) => i !== idx)
      return { ...prev, image_urls: next.length === 0 ? [''] : next }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    
    // Clean URLs list
    const validUrls = form.image_urls.map(url => url.trim()).filter(Boolean)

    const payload = {
      ...form,
      price: Number(form.price),
      year: Number(form.year),
      quantity: Number(form.quantity),
      mileage: Number(form.mileage || 0),
      image_urls: validUrls,
      image_url: validUrls[0] || null,
      is_on_sale: !!form.is_on_sale,
      sale_price: form.is_on_sale && form.sale_price ? Number(form.sale_price) : null,
    }
    if (!payload.description) delete payload.description
    if (!payload.color) delete payload.color
    onSubmit(payload)
  }

  const field = (name, label, props = {}) => (
    <div>
      <label className="block text-xs text-[#8e98aa] mb-1.5 font-bold uppercase tracking-wider">{label}</label>
      <input
        id={`vehicle-${name}`}
        name={name}
        value={form[name] ?? ''}
        onChange={handleChange}
        className={`form-input text-sm ${errors[name] ? 'border-red-500/60' : ''}`}
        {...props}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1.5 font-bold">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-[#e6eef8]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#e6eef8] w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-slide-up rounded-3xl p-5"
           style={{ boxShadow: '12px 12px 24px #c2cbda, -12px -12px 24px #ffffff' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#e6eef8] rounded-2xl shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] mb-5 border border-[#d8e0ed]/20">
          <h2 className="text-lg font-extrabold text-[#1d1d1f]">
            {isEdit ? '✏️ Edit Vehicle' : '➕ Add New Vehicle'}
          </h2>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="text-[#8e98aa] hover:text-[#1d1d1f] p-1.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {field('make', 'Make *', { placeholder: 'e.g. Toyota' })}
          {field('model', 'Model *', { placeholder: 'e.g. Camry' })}
          {field('year', 'Year *', { type: 'number', min: 1900, max: 2030 })}

          {/* Category */}
          <div>
            <label className="block text-xs text-[#8e98aa] mb-1.5 font-bold uppercase tracking-wider">Category *</label>
            <select
              id="vehicle-category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="form-input text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#e6eef8] text-[#1d1d1f]">{c}</option>
              ))}
            </select>
          </div>

          {field('price', 'Price (INR) *', { type: 'number', min: 0.01, step: '0.01', placeholder: '25000' })}
          {field('quantity', 'Quantity', { type: 'number', min: 0, placeholder: '1' })}
          {field('color', 'Color', { placeholder: 'e.g. Midnight Black' })}
          {field('mileage', 'Mileage', { type: 'number', min: 0, placeholder: '0' })}

          {/* Sale Properties */}
          <div className="flex items-center h-full pt-5 px-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-[#1d1d1f] font-bold text-xs">
              <input
                id="vehicle-is_on_sale"
                type="checkbox"
                name="is_on_sale"
                checked={!!form.is_on_sale}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, is_on_sale: e.target.checked }))
                  setErrors((prev) => ({ ...prev, sale_price: undefined }))
                }}
                className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3]/30 border-[#c2cbda] bg-[#e6eef8] shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
              />
              <span>🏷️ Mark as On Sale</span>
            </label>
          </div>

          {form.is_on_sale ? (
            field('sale_price', 'Sale Price (INR) *', { type: 'number', min: 0.01, step: '0.01', placeholder: 'Discounted Price' })
          ) : (
            <div />
          )}

          {/* Photos list */}
          <div className="col-span-2 space-y-3 mt-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-[#8e98aa] font-bold uppercase tracking-wider">
                📸 Car Photo URLs
                <span className="ml-1 text-[10px] text-[#8e98aa] font-normal font-sans tracking-normal lowercase">(first is main preview)</span>
              </label>
              <button
                type="button"
                onClick={addImageUrlField}
                className="text-[11px] text-[#0071e3] font-bold px-2 py-0.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
              >
                + Add Photo
              </button>
            </div>
            
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {form.image_urls.map((url, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="text-xs text-[#8e98aa] font-mono font-bold w-6">#{idx + 1}</div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                    placeholder={idx === 0 ? "https://example.com/main-photo.jpg" : `https://example.com/photo-${idx + 1}.jpg`}
                    className="form-input text-sm py-2 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrlField(idx)}
                    className="p-2 text-[#8e98aa] hover:text-red-500 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff] transition-all duration-150"
                    title="Remove URL"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2 mt-1">
            <label className="block text-xs text-[#8e98aa] mb-1.5 font-bold uppercase tracking-wider">Description</label>
            <textarea
              id="vehicle-description"
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Vehicle description..."
              className="form-input text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button id="submit-vehicle-btn" type="submit" disabled={loading} className="btn-primary flex-1">
              {loading
                ? (isEdit ? 'Updating...' : 'Adding...')
                : (isEdit ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
