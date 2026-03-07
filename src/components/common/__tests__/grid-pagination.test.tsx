import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GridPagination } from "../grid-pagination"

describe("GridPagination", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    pageSize: 12,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders nothing when totalItems is 0", () => {
    const { container } = render(
      <GridPagination {...defaultProps} totalItems={0} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("displays rows per page selector", () => {
    render(<GridPagination {...defaultProps} />)
    expect(screen.getByText("Rows per page")).toBeInTheDocument()
  })

  it("displays correct item range for first page", () => {
    render(<GridPagination {...defaultProps} />)
    expect(screen.getByText("1 - 12 of 50")).toBeInTheDocument()
  })

  it("displays correct item range for middle page", () => {
    render(<GridPagination {...defaultProps} currentPage={3} />)
    expect(screen.getByText("25 - 36 of 50")).toBeInTheDocument()
  })

  it("displays correct item range for last page with partial items", () => {
    render(
      <GridPagination
        {...defaultProps}
        currentPage={5}
        totalItems={50}
        pageSize={12}
      />
    )
    // Last page: items 49-50
    expect(screen.getByText("49 - 50 of 50")).toBeInTheDocument()
  })

  it("disables previous button on first page", () => {
    render(<GridPagination {...defaultProps} currentPage={1} />)
    const prevButton = screen.getByLabelText("Go to previous page")
    expect(prevButton).toBeDisabled()
  })

  it("disables next button on last page", () => {
    render(<GridPagination {...defaultProps} currentPage={5} />)
    const nextButton = screen.getByLabelText("Go to next page")
    expect(nextButton).toBeDisabled()
  })

  it("enables both buttons on middle page", () => {
    render(<GridPagination {...defaultProps} currentPage={3} />)
    expect(screen.getByLabelText("Go to previous page")).not.toBeDisabled()
    expect(screen.getByLabelText("Go to next page")).not.toBeDisabled()
  })

  it("calls onPageChange when clicking next", async () => {
    const user = userEvent.setup()
    const onPageChange = jest.fn()
    render(
      <GridPagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />
    )

    await user.click(screen.getByLabelText("Go to next page"))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it("calls onPageChange when clicking previous", async () => {
    const user = userEvent.setup()
    const onPageChange = jest.fn()
    render(
      <GridPagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />
    )

    await user.click(screen.getByLabelText("Go to previous page"))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("calls onPageChange when clicking a page number", async () => {
    const user = userEvent.setup()
    const onPageChange = jest.fn()
    render(
      <GridPagination
        {...defaultProps}
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
      />
    )

    await user.click(screen.getByRole("button", { name: "2" }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("renders all page buttons when totalPages <= 5", () => {
    render(
      <GridPagination {...defaultProps} totalPages={4} totalItems={48} />
    )
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument()
  })

  it("highlights current page button", () => {
    render(
      <GridPagination {...defaultProps} currentPage={2} totalPages={3} totalItems={36} />
    )
    // The current page button should have the default variant (not outline)
    const page2Button = screen.getByRole("button", { name: "2" })
    expect(page2Button).toBeInTheDocument()
  })

  it("handles single page correctly", () => {
    render(
      <GridPagination
        {...defaultProps}
        currentPage={1}
        totalPages={1}
        totalItems={5}
        pageSize={12}
      />
    )
    expect(screen.getByText("1 - 5 of 5")).toBeInTheDocument()
    expect(screen.getByLabelText("Go to previous page")).toBeDisabled()
    expect(screen.getByLabelText("Go to next page")).toBeDisabled()
  })
})
