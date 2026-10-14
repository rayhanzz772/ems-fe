"use client"

import { ChevronDownIcon } from "lucide-react"
import { cn } from "cn"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

type SelectMenuOption = {
  value: string
  label: string
}

function SelectMenu({
  value,
  options,
  onChange,
  placeholder,
  id,
  ariaLabel,
  className,
  contentClassName,
  disabled,
}: {
  value: string
  options: readonly SelectMenuOption[]
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  ariaLabel?: string
  className?: string
  contentClassName?: string
  disabled?: boolean
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full min-w-0 shrink-0 cursor-pointer items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 text-sm transition-[color,box-shadow] outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted disabled:pointer-events-none disabled:opacity-50",
          className
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? value}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className={contentClassName}>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(String(next))}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              closeOnClick
            >
              <span className="truncate">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { SelectMenu }
export type { SelectMenuOption }
