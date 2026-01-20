import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FAQSection } from '../faq-section'

describe('FAQSection', () => {
  it('renders FAQ section with all questions', () => {
    render(<FAQSection />)
    
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
    expect(screen.getByText('What is Wrench Cloud?')).toBeInTheDocument()
    expect(screen.getByText('How do Digital Vehicle Inspections work?')).toBeInTheDocument()
  })

  it('opens an FAQ item when clicked', async () => {
    const user = userEvent.setup()
    render(<FAQSection />)
    
    const firstQuestion = screen.getByText('What is Wrench Cloud?')
    await user.click(firstQuestion)
    
    // Check that the answer is visible
    expect(screen.getByText(/Wrench Cloud is garage management software/)).toBeInTheDocument()
  })

  it('closes an open FAQ item when clicked again', async () => {
    const user = userEvent.setup()
    render(<FAQSection />)
    
    const firstQuestion = screen.getByText('What is Wrench Cloud?')
    
    // Open the item
    await user.click(firstQuestion)
    expect(screen.getByText(/Wrench Cloud is garage management software/)).toBeInTheDocument()
    
    // Close the item
    await user.click(firstQuestion)
    
    // The answer should not be visible (checking opacity via parent element classes)
    const answerElement = screen.getByText(/Wrench Cloud is garage management software/).parentElement
    expect(answerElement?.parentElement).toHaveClass('max-h-0', 'opacity-0')
  })

  it('automatically closes previously opened item when opening a new one', async () => {
    const user = userEvent.setup()
    render(<FAQSection />)
    
    const firstQuestion = screen.getByText('What is Wrench Cloud?')
    const secondQuestion = screen.getByText('How do Digital Vehicle Inspections work?')
    
    // Open first item
    await user.click(firstQuestion)
    expect(screen.getByText(/Wrench Cloud is garage management software/)).toBeInTheDocument()
    
    // Open second item
    await user.click(secondQuestion)
    expect(screen.getByText(/Our DVI feature lets technicians capture photos/)).toBeInTheDocument()
    
    // First item should now be closed (checking the parent element has closed classes)
    const firstAnswer = screen.getByText(/Wrench Cloud is garage management software/).parentElement
    expect(firstAnswer?.parentElement).toHaveClass('max-h-0', 'opacity-0')
  })

  it('ensures only one FAQ item can be open at a time', async () => {
    const user = userEvent.setup()
    render(<FAQSection />)
    
    const questions = [
      'What is Wrench Cloud?',
      'How do Digital Vehicle Inspections work?',
      'Can I import my existing customer data?',
    ]
    
    // Open first question
    await user.click(screen.getByText(questions[0]))
    
    // Open second question
    await user.click(screen.getByText(questions[1]))
    
    // Open third question
    await user.click(screen.getByText(questions[2]))
    
    // Only the third answer should be visible with open classes
    const thirdAnswer = screen.getByText(/Yes! We offer easy data import/)
    expect(thirdAnswer).toBeInTheDocument()
    
    // Check that other answers have closed classes
    const firstAnswer = screen.getByText(/Wrench Cloud is garage management software/).parentElement
    const secondAnswer = screen.getByText(/Our DVI feature lets technicians capture photos/).parentElement
    
    expect(firstAnswer?.parentElement).toHaveClass('max-h-0', 'opacity-0')
    expect(secondAnswer?.parentElement).toHaveClass('max-h-0', 'opacity-0')
  })
})
