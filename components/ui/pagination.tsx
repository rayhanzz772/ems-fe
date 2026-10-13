import * as React from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

function Pagination({
  className,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label={ariaLabel}
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn(
        "flex flex-wrap items-center justify-center gap-1",
        className
      )}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  /**
   * Renders the link as a disabled control: no `href`, removed from the tab
   * order, and marked with `aria-disabled` so assistive tech announces it.
   */
  disabled?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive = false,
  disabled = false,
  size = "icon",
  href,
  onClick,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      disabled={disabled}
      className={cn(
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className
      )}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          aria-disabled={disabled || undefined}
          data-slot="pagination-link"
          data-active={isActive || undefined}
          href={disabled ? undefined : href}
          onClick={disabled ? undefined : onClick}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-2!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-2!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

/**
 * Page numbers to render for a paginated list: the current page plus
 * `siblingCount` neighbours on each side, always including the first and last
 * page. Skipped runs are collapsed into an `"ellipsis"` marker.
 */
function getPaginationRange(
  currentPage: number,
  pageCount: number,
  siblingCount = 1
): (number | "ellipsis")[] {
  const maxWindow = 2 * siblingCount + 3

  if (pageCount <= maxWindow) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const windowStart = Math.max(
    2,
    Math.min(currentPage - siblingCount, pageCount - maxWindow + 2)
  )
  const windowEnd = Math.min(
    pageCount - 1,
    Math.max(currentPage + siblingCount, maxWindow - 1)
  )

  const pages: (number | "ellipsis")[] = [1]
  if (windowStart > 2) pages.push("ellipsis")
  for (let page = windowStart; page <= windowEnd; page += 1) pages.push(page)
  if (windowEnd < pageCount - 1) pages.push("ellipsis")
  pages.push(pageCount)

  return pages
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  getPaginationRange,
}
