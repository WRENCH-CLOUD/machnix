"use client"

import {
    createContext,
    useContext,
    type CSSProperties,
    type ReactNode,
} from "react"
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    type CollisionDetection,
} from "@dnd-kit/core"
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

interface KanbanContextValue {
    isMobile: boolean
}

const KanbanContext = createContext<KanbanContextValue>({ isMobile: false })

function useKanban() {
    return useContext(KanbanContext)
}

/* -------------------------------------------------------------------------- */
/*  KanbanBoard                                                               */
/* -------------------------------------------------------------------------- */

interface KanbanBoardProps {
    children: ReactNode
    /** Called when a card starts being dragged */
    onDragStart?: (event: DragStartEvent) => void
    /** Called when a card is dragged over a new zone */
    onDragOver?: (event: DragOverEvent) => void
    /** Called when a card is dropped */
    onDragEnd: (event: DragEndEvent) => void
    /** Called when a drag is cancelled (e.g. Escape key) */
    onDragCancel?: () => void
    /** Whether the board is on a mobile device — adjusts column widths & touch tolerance */
    isMobile?: boolean
    /** Collision detection strategy (defaults to closestCorners) */
    collisionDetection?: CollisionDetection
    /** Content rendered inside <DragOverlay> */
    overlay?: ReactNode
    className?: string
}

function KanbanBoard({
    children,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    isMobile = false,
    collisionDetection = closestCorners,
    overlay,
    className,
}: KanbanBoardProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: isMobile ? 10 : 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    return (
        <KanbanContext.Provider value={{ isMobile }}>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={onDragCancel}
            >
                <div
                    data-slot="kanban-board"
                    className={cn(
                        "flex gap-2 md:gap-3 h-full w-full overflow-x-auto pb-2",
                        isMobile && "snap-x snap-mandatory scroll-smooth",
                        className,
                    )}
                >
                    {children}
                </div>

                <DragOverlay>{overlay}</DragOverlay>
            </DndContext>
        </KanbanContext.Provider>
    )
}

/* -------------------------------------------------------------------------- */
/*  KanbanColumn                                                              */
/* -------------------------------------------------------------------------- */

interface KanbanColumnProps {
    /** Unique column identifier used for the droppable zone */
    id: string
    children: ReactNode
    /** Externally controlled highlight — use when child sortables steal isOver */
    isActive?: boolean
    /** Optional right-click handler */
    onContextMenu?: (e: React.MouseEvent) => void
    className?: string
}

function KanbanColumn({
    id,
    children,
    isActive,
    onContextMenu,
    className,
}: KanbanColumnProps) {
    const { isMobile } = useKanban()
    const { setNodeRef, isOver } = useDroppable({ id })

    const highlighted = isActive ?? isOver

    return (
        <div
            ref={setNodeRef}
            data-slot="kanban-column"
            className={cn(
                "shrink-0 flex flex-col bg-secondary/30 rounded-xl border border-border h-full transition-all snap-start",
                isMobile ? "w-[calc(100vw-3rem)] min-w-70" : "w-72 lg:w-80",
                highlighted && "border-primary/50 bg-primary/5 ring-2 ring-primary/20",
                className,
            )}
            onContextMenu={onContextMenu}
        >
            {children}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*  KanbanColumnHeader                                                        */
/* -------------------------------------------------------------------------- */

interface KanbanColumnHeaderProps {
    /** Status indicator color — accepts any Tailwind bg class */
    indicatorColor?: string
    /** Column title */
    title: string
    /** Item count */
    count?: number
    children?: ReactNode
    className?: string
}

function KanbanColumnHeader({
    indicatorColor,
    title,
    count,
    children,
    className,
}: KanbanColumnHeaderProps) {
    return (
        <div
            data-slot="kanban-column-header"
            className={cn("p-3 border-b border-border shrink-0", className)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {indicatorColor && (
                        <div className={cn("w-3 h-3 rounded-full", indicatorColor)} />
                    )}
                    <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {children}
                    {count !== undefined && (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full tabular-nums">
                            {count}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*  KanbanColumnBody                                                          */
/* -------------------------------------------------------------------------- */

interface KanbanColumnBodyProps {
    /** The IDs of the items in this column, used by SortableContext */
    itemIds: string[]
    /** The sortable context id (typically matches column id) */
    sortableId?: string
    children: ReactNode
    /** Message shown when column is empty */
    emptyMessage?: string
    className?: string
}

function KanbanColumnBody({
    itemIds,
    sortableId,
    children,
    emptyMessage = "No items",
    className,
}: KanbanColumnBodyProps) {
    return (
        <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
            id={sortableId}
        >
            <div
                data-slot="kanban-column-body"
                className={cn("flex-1 overflow-y-auto p-3 space-y-3", className)}
            >
                {children}
                {itemIds.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </SortableContext>
    )
}

/* -------------------------------------------------------------------------- */
/*  KanbanCard                                                                */
/* -------------------------------------------------------------------------- */

interface KanbanCardProps {
    /** Unique card identifier — must match an id in the parent KanbanColumnBody's itemIds */
    id: string
    children: ReactNode
    /** Click handler for the card */
    onClick?: () => void
    className?: string
}

function KanbanCard({ id, children, onClick, className }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        transition: {
            duration: 200,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        },
    })

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-slot="kanban-card"
            {...attributes}
            {...listeners}
        >
            <div
                className={cn(
                    "group relative bg-card rounded-xl border border-border/50 hover:shadow-md transition-all cursor-pointer",
                    className,
                )}
                onClick={onClick}
            >
                {children}
            </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

export {
    KanbanBoard,
    KanbanColumn,
    KanbanColumnHeader,
    KanbanColumnBody,
    KanbanCard,
    useKanban,
}

export type {
    KanbanBoardProps,
    KanbanColumnProps,
    KanbanColumnHeaderProps,
    KanbanColumnBodyProps,
    KanbanCardProps,
}
