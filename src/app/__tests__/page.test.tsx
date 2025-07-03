import { render, screen } from '@testing-library/react'

// Simple test component to verify testing setup
const TestComponent = () => {
  return (
    <div>
      <h1>Equity Insights AI</h1>
      <p>Test component for CI/CD</p>
    </div>
  )
}

describe('Application Tests', () => {
  it('renders test component', () => {
    render(<TestComponent />)
    expect(screen.getByText('Equity Insights AI')).toBeInTheDocument()
    expect(screen.getByText('Test component for CI/CD')).toBeInTheDocument()
  })

  it('performs basic math operations', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
    expect(8 / 2).toBe(4)
  })

  it('validates string operations', () => {
    const testString = 'Equity Insights AI'
    expect(testString.toLowerCase()).toBe('equity insights ai')
    expect(testString.toUpperCase()).toBe('EQUITY INSIGHTS AI')
    expect(testString.length).toBe(18)
  })

  it('validates array operations', () => {
    const testArray = ['AAPL', 'GOOGL', 'MSFT']
    expect(testArray.length).toBe(3)
    expect(testArray.includes('AAPL')).toBe(true)
    expect(testArray.includes('TSLA')).toBe(false)
  })

  it('validates object operations', () => {
    const testObject = {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      price: 150.00
    }
    expect(testObject.ticker).toBe('AAPL')
    expect(testObject.name).toBe('Apple Inc.')
    expect(testObject.price).toBe(150.00)
  })
})
