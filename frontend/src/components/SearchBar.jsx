import { useState } from 'react'

const CATEGORIES = ['', 'Sedan', 'SUV', 'Truck', 'Coupe', 'Van', 'Electric', 'Convertible', 'Pickup']

export default function SearchBar({ onSearch }) {
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    category: '',
    min_price: '',
    max_price: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...filters, [name]: value }
    setFilters(next)
    // Build params (omit empty strings)
    const params = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== '')
    )
    onSearch(params)
  }

  const handleClear = () => {
    setFilters({ make: '', model: '', category: '', min_price: '', max_price: '' })
    onSearch({})
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          🔍 Filter Vehicles
        </h2>
        {hasFilters && (
          <button
            id="clear-filters-btn"
            onClick={handleClear}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Make */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Make</label>
          <input
            id="filter-make"
            data-testid="filter-make"
            name="make"
            value={filters.make}
            onChange={handleChange}
            placeholder="e.g. Toyota"
            className="form-input text-sm py-2"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Model</label>
          <input
            id="filter-model"
            data-testid="filter-model"
            name="model"
            value={filters.model}
            onChange={handleChange}
            placeholder="e.g. Camry"
            className="form-input text-sm py-2"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Category</label>
          <select
            id="filter-category"
            data-testid="filter-category"
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="form-input text-sm py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-slate-800">
                {c === '' ? 'All categories' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Min price */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Min Price</label>
          <input
            id="filter-min-price"
            data-testid="filter-min-price"
            type="number"
            name="min_price"
            value={filters.min_price}
            onChange={handleChange}
            placeholder="$0"
            min="0"
            className="form-input text-sm py-2"
          />
        </div>

        {/* Max price */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-medium">Max Price</label>
          <input
            id="filter-max-price"
            data-testid="filter-max-price"
            type="number"
            name="max_price"
            value={filters.max_price}
            onChange={handleChange}
            placeholder="No limit"
            min="0"
            className="form-input text-sm py-2"
          />
        </div>
      </div>
    </div>
  )
}
