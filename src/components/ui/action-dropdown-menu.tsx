import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RiArchiveLine, RiArrowRightLine, RiDeleteBinLine, RiFileCopyLine, RiFolderLine, RiLinkM, RiMore2Fill, RiPencilLine, RiStackshareLine, RiStarLine } from '@remixicon/react'

export function ActionsDropdownMenu() {
    return (
        <div className="flex items-center justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <RiMore2Fill aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <RiPencilLine aria-hidden="true" />
                            Edit
                            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <RiFileCopyLine aria-hidden="true" />
                            Duplicate
                            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <RiArrowRightLine aria-hidden="true" />
                                Move to
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem>
                                        <RiFolderLine aria-hidden="true" />
                                        Projects
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <RiArchiveLine aria-hidden="true" />
                                        Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <RiStarLine aria-hidden="true" />
                                        Favorites
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <RiStackshareLine aria-hidden="true" />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <RiLinkM aria-hidden="true" />
                            Copy Link
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                        <RiDeleteBinLine aria-hidden="true" />
                        Delete
                        <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
