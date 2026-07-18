import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from '../components/SearchBar'

describe('SearchBar', () => {
  it('renders all filter inputs', () => {
    render(<SearchBar onSearch={vi.fn()} />)
    expect(screen.getByTestId('filter-make')).toBeInTheDocument()
    expect(screen.getByTestId('filter-model')).toBeInTheDocument()
    expect(screen.getByTestId('filter-category')).toBeInTheDocument()
    expect(screen.getByTestId('filter-min-price')).toBeInTheDocument()
    expect(screen.getByTestId('filter-max-price')).toBeInTheDocument()
  })

  it('calls onSearch with make filter when make input changes', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.change(screen.getByTestId('filter-make'), { target: { name: 'make', value: 'Toyota' } })
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ make: 'Toyota' }))
  })

  it('calls onSearch with model filter when model input changes', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.change(screen.getByTestId('filter-model'), { target: { name: 'model', value: 'Camry' } })
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ model: 'Camry' }))
  })

  it('calls onSearch with category when category changes', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.change(screen.getByTestId('filter-category'), { target: { name: 'category', value: 'SUV' } })
    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ category: 'SUV' }))
  })

  it('does not include empty fields in search params', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.change(screen.getByTestId('filter-make'), { target: { name: 'make', value: 'BMW' } })
    const lastCall = onSearch.mock.calls[onSearch.mock.calls.length - 1][0]
    expect(Object.keys(lastCall)).not.toContain('model')
    expect(Object.keys(lastCall)).not.toContain('category')
  })

  it('shows "Clear all" button only when filters are active', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
    fireEvent.change(screen.getByTestId('filter-make'), { target: { name: 'make', value: 'Ford' } })
    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('calls onSearch with empty object when Clear all is clicked', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.change(screen.getByTestId('filter-make'), { target: { name: 'make', value: 'Ford' } })
    fireEvent.click(screen.getByText('Clear all'))
    expect(onSearch).toHaveBeenLastCalledWith({})
  })
})
