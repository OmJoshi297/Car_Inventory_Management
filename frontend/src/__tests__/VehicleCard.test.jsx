import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VehicleCard from '../components/VehicleCard'

const baseVehicle = {
  id: 1,
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  category: 'Sedan',
  price: 25000,
  quantity: 5,
  color: 'Silver',
  mileage: 0,
  image_url: null,
  description: 'A reliable sedan',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const defaultProps = {
  vehicle: baseVehicle,
  onPurchase: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRestock: vi.fn(),
  isAdmin: false,
  purchasing: false,
}

describe('VehicleCard', () => {
  it('renders vehicle make, model, and year', () => {
    render(<VehicleCard {...defaultProps} />)
    expect(screen.getByText(/2023 Toyota Camry/i)).toBeInTheDocument()
  })

  it('renders the formatted price', () => {
    render(<VehicleCard {...defaultProps} />)
    expect(screen.getByText(/\$25,000/)).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    render(<VehicleCard {...defaultProps} />)
    expect(screen.getByText('Sedan')).toBeInTheDocument()
  })

  it('shows "New" for zero mileage', () => {
    render(<VehicleCard {...defaultProps} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('shows formatted mileage when non-zero', () => {
    render(<VehicleCard {...defaultProps} vehicle={{ ...baseVehicle, mileage: 15000 }} />)
    expect(screen.getByText('15,000 mi')).toBeInTheDocument()
  })

  describe('Purchase button', () => {
    it('is enabled when vehicle has stock', () => {
      render(<VehicleCard {...defaultProps} />)
      const btn = screen.getByTestId('purchase-btn')
      expect(btn).not.toBeDisabled()
    })

    it('is DISABLED when quantity is 0 (out of stock)', () => {
      render(
        <VehicleCard {...defaultProps} vehicle={{ ...baseVehicle, quantity: 0 }} />
      )
      const btn = screen.getByTestId('purchase-btn')
      expect(btn).toBeDisabled()
    })

    it('calls onPurchase with vehicle id when clicked', () => {
      const onPurchase = vi.fn()
      render(<VehicleCard {...defaultProps} onPurchase={onPurchase} />)
      fireEvent.click(screen.getByTestId('purchase-btn'))
      expect(onPurchase).toHaveBeenCalledWith(1)
    })

    it('shows "Out of Stock" text when quantity is 0', () => {
      render(
        <VehicleCard {...defaultProps} vehicle={{ ...baseVehicle, quantity: 0 }} />
      )
      expect(screen.getAllByText(/out of stock/i).length).toBeGreaterThan(0)
    })

    it('is DISABLED when purchasing prop is true', () => {
      render(<VehicleCard {...defaultProps} purchasing={true} />)
      const btn = screen.getByTestId('purchase-btn')
      expect(btn).toBeDisabled()
    })

    it('shows processing state when purchasing', () => {
      render(<VehicleCard {...defaultProps} purchasing={true} />)
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })
  })

  describe('Admin controls', () => {
    it('does NOT show admin buttons for non-admin users', () => {
      render(<VehicleCard {...defaultProps} isAdmin={false} />)
      expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('restock-btn')).not.toBeInTheDocument()
    })

    it('shows edit, delete, and restock buttons for admin users', () => {
      render(<VehicleCard {...defaultProps} isAdmin={true} />)
      expect(screen.getByTestId('edit-btn')).toBeInTheDocument()
      expect(screen.getByTestId('delete-btn')).toBeInTheDocument()
      expect(screen.getByTestId('restock-btn')).toBeInTheDocument()
    })

    it('calls onEdit with the vehicle when edit is clicked', () => {
      const onEdit = vi.fn()
      render(<VehicleCard {...defaultProps} isAdmin={true} onEdit={onEdit} />)
      fireEvent.click(screen.getByTestId('edit-btn'))
      expect(onEdit).toHaveBeenCalledWith(baseVehicle)
    })

    it('calls onDelete with vehicle id when delete is clicked', () => {
      const onDelete = vi.fn()
      render(<VehicleCard {...defaultProps} isAdmin={true} onDelete={onDelete} />)
      fireEvent.click(screen.getByTestId('delete-btn'))
      expect(onDelete).toHaveBeenCalledWith(1)
    })
  })

  describe('Stock badge', () => {
    it('shows green badge when quantity > 2', () => {
      render(<VehicleCard {...defaultProps} vehicle={{ ...baseVehicle, quantity: 10 }} />)
      expect(screen.getByText('10 left')).toBeInTheDocument()
    })

    it('shows "0 left" when out of stock', () => {
      render(<VehicleCard {...defaultProps} vehicle={{ ...baseVehicle, quantity: 0 }} />)
      expect(screen.getByText('0 left')).toBeInTheDocument()
    })
  })
})
