import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

describe('UI Components', () => {
  describe('Button', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('handles disabled state', () => {
      render(<Button disabled>Disabled Button</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies variant classes', () => {
      render(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })
  })

  describe('Input', () => {
    it('renders input field', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
    })

    it('handles value prop', () => {
      render(<Input value="test value" readOnly />)
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
    })
  })

  describe('Card', () => {
    it('renders card with content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })
  })
})
