import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ViewToggle, ViewMode } from "../view-toggle"

describe("ViewToggle", () => {
  it("renders grid and table toggle buttons", () => {
    const onChange = jest.fn()
    render(<ViewToggle value="grid" onChange={onChange} />)

    expect(screen.getByLabelText("Grid view")).toBeInTheDocument()
    expect(screen.getByLabelText("Table view")).toBeInTheDocument()
  })

  it("highlights the active view mode (grid)", () => {
    const onChange = jest.fn()
    render(<ViewToggle value="grid" onChange={onChange} />)

    const gridButton = screen.getByLabelText("Grid view")
    expect(gridButton).toHaveAttribute("data-state", "on")

    const tableButton = screen.getByLabelText("Table view")
    expect(tableButton).toHaveAttribute("data-state", "off")
  })

  it("highlights the active view mode (table)", () => {
    const onChange = jest.fn()
    render(<ViewToggle value="table" onChange={onChange} />)

    const gridButton = screen.getByLabelText("Grid view")
    expect(gridButton).toHaveAttribute("data-state", "off")

    const tableButton = screen.getByLabelText("Table view")
    expect(tableButton).toHaveAttribute("data-state", "on")
  })

  it("calls onChange when switching to table view", async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<ViewToggle value="grid" onChange={onChange} />)

    await user.click(screen.getByLabelText("Table view"))
    expect(onChange).toHaveBeenCalledWith("table")
  })

  it("calls onChange when switching to grid view", async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<ViewToggle value="table" onChange={onChange} />)

    await user.click(screen.getByLabelText("Grid view"))
    expect(onChange).toHaveBeenCalledWith("grid")
  })

  it("does not call onChange when clicking the already active toggle", async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(<ViewToggle value="grid" onChange={onChange} />)

    await user.click(screen.getByLabelText("Grid view"))
    // Radix ToggleGroup won't fire onValueChange with empty string because
    // we guard against it, so onChange should not be called
    expect(onChange).not.toHaveBeenCalled()
  })
})
