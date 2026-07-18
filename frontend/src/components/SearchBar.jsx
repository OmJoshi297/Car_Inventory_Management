import { useState } from 'react'

const CATEGORIES = ['', 'Sedan', 'SUV', 'Truck', 'Coupe', 'Van', 'Electric', 'Convertible', 'Pickup']

export default function SearchBar({ onSearch }) {
  const [filters, setFilters] = useState({
    make: '', model: '', category: '', min_price: '', max_price: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    const next = { ...filters, [name]: value }
    setFilters(next)
    onSearch(Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '')))
  }

  const handleClear = () => {
    setFilters({ make: '', model: '', category: '', min_price: '', max_price: '' })
    onSearch({})
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="bg-[#e6eef8] rounded-2xl p-4 animate-fade-in shadow-[6px_6px_12px_#c2cbda,-6px_-6px_12px_#ffffff]">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[#51576c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-[11px] text-[#51576c] font-bold uppercase tracking-widest">Filters</span>
        </div>
        {hasFilters && (
          <button
            id="clear-filters-btn"
            onClick={handleClear}
            className="text-[11px] text-[#0071e3] hover:underline font-bold transition-all px-2.5 py-1 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <input
          id="filter-make" data-testid="filter-make"
          name="make" value={filters.make} onChange={handleChange}
          placeholder="Make" className="form-input py-2 text-xs"
        />
        <input
          id="filter-model" data-testid="filter-model"
          name="model" value={filters.model} onChange={handleChange}
          placeholder="Model" className="form-input py-2 text-xs"
        />
        <select
          id="filter-category" data-testid="filter-category"
          name="category" value={filters.category} onChange={handleChange}
          className="form-input py-2 text-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#e6eef8] text-[#1d1d1f]">{c === '' ? 'All types' : c}</option>
          ))}
        </select>
        <input
          id="filter-min-price" data-testid="filter-min-price"
          type="number" name="min_price" value={filters.min_price} onChange={handleChange}
          placeholder="Min price" min="0" className="form-input py-2 text-xs"
        />
        <input
          id="filter-max-price" data-testid="filter-max-price"
          type="number" name="max_price" value={filters.max_price} onChange={handleChange}
          placeholder="Max price" min="0" className="form-input py-2 text-xs"
        />
      </div>
    </div>
  )
}
