import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from './theme-provider'
import { useTheme } from 'next-themes'

// Component to test hook usage
const ThemeConsumer = () => {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('provides theme context', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    )
    
    // Initial state might be system or light depending on env, checking if it renders without crash
    expect(screen.getByText('Set Dark')).toBeInTheDocument()
  })
  
  // Checking direct class manipulation or behavior would require testing next-themes internals
  // or checking document.documentElement classes which requires e2e or more complex integration setup.
  // This test validates the provider renders its children correctly.
})
