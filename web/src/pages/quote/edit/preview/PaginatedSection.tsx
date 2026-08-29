import React, { useLayoutEffect, useRef, useState } from 'react'
import { A4Page } from './A4Page'
import {
  CONTENT_AVAILABLE_HEIGHT_MM,
  CONTENT_AREA_WIDTH_PX,
} from './documentConstants'

// Splits an HTML string into individual top-level block elements so each
// paragraph/list can be a separate PaginatedSection child. This prevents a long
// text section from being treated as a single atomic unit that overflows its
// A4Page (which has overflow:hidden) when it is taller than the page.
export function splitHtmlToBlocks(html: string): string[] {
  if (!html.trim()) return ['']
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const blocks: string[] = []
  doc.body.childNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      // Empty <p> elements have zero clientHeight; replace with &nbsp; so they
      // render with line-height and produce visible spacing.
      if (
        element.tagName.toLowerCase() === 'p' &&
        !element.textContent?.trim()
      ) {
        blocks.push('<p>&nbsp;</p>')
      } else {
        blocks.push(element.outerHTML)
      }
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push(`<p>${node.textContent.trim()}</p>`)
    }
  })
  return blocks.length > 0 ? blocks : ['']
}

// Renders children into a hidden measurement div, then distributes them across
// as many A4Page wrappers as needed so no page exceeds contentAvailableHeightMm.
//
// Each direct child is treated as an atomic unit — a child taller than a full
// page will be placed alone and overflow. Keep children small (one paragraph,
// one block element).
//
// When pageHeader is provided it renders above contentContainerStyle on every
// page. Its height is measured and subtracted from each page's available budget.
// When contentContainerStyle is provided, each page's content chunk is wrapped
// in a div with that style. contentContainerPaddingMm specifies additional
// vertical overhead (top + bottom padding) subtracted from the budget.
export function PaginatedSection({
  startPageNumber,
  quoteNumber,
  children,
  onPageCountChange,
  contentAvailableHeightMm = CONTENT_AVAILABLE_HEIGHT_MM,
  pageHeader,
  contentContainerStyle,
  contentContainerPaddingMm = 0,
  contentWatermark,
}: {
  startPageNumber: number
  quoteNumber: string
  children: React.ReactNode
  onPageCountChange?: (count: number) => void
  contentAvailableHeightMm?: number
  pageHeader?: React.ReactNode
  contentContainerStyle?: React.CSSProperties
  contentContainerPaddingMm?: number
  contentWatermark?: React.ReactNode
}) {
  const allChildren = React.Children.toArray(children)
  const measureRef = useRef<HTMLDivElement>(null)
  const headerMeasureRef = useRef<HTMLDivElement>(null)
  const [pageItemCounts, setPageItemCounts] = useState<number[]>([])
  const lastReportedPageCount = useRef(0)

  const pages: React.ReactNode[][] =
    pageItemCounts.length === 0
      ? [allChildren]
      : pageItemCounts.map((count, pageIndex) => {
          const offset = pageItemCounts
            .slice(0, pageIndex)
            .reduce((sum, currentCount) => sum + currentCount, 0)
          return allChildren.slice(offset, offset + count)
        })

  useLayoutEffect(() => {
    const container = measureRef.current
    if (!container) return
    const domChildren = Array.from(container.children) as HTMLElement[]
    // The hidden div may contain a header measurement child before the content
    // children — skip it by counting from the end.
    const contentDomChildren = domChildren.slice(
      domChildren.length - allChildren.length,
    )
    if (contentDomChildren.length !== allChildren.length) return

    const headerHeight =
      headerMeasureRef.current?.getBoundingClientRect().height ?? 0
    const contentPaddingPx = (contentContainerPaddingMm * 96) / 25.4
    const availableHeightPx = contentAvailableHeightMm * (96 / 25.4)
    const effectiveBudget = availableHeightPx - headerHeight - contentPaddingPx

    const newCounts: number[] = []
    let currentCount = 0
    let currentHeight = 0

    contentDomChildren.forEach(el => {
      const itemHeight = el.getBoundingClientRect().height
      if (currentCount > 0 && currentHeight + itemHeight > effectiveBudget) {
        newCounts.push(currentCount)
        currentCount = 0
        currentHeight = 0
      }
      currentCount++
      currentHeight += itemHeight
    })
    if (currentCount > 0) newCounts.push(currentCount)
    if (newCounts.length === 0) return

    setPageItemCounts(prev => {
      const unchanged =
        prev.length === newCounts.length &&
        prev.every((count, index) => count === newCounts[index])
      return unchanged ? prev : newCounts
    })

    if (newCounts.length !== lastReportedPageCount.current) {
      lastReportedPageCount.current = newCounts.length
      onPageCountChange?.(newCounts.length)
    }
  })

  return (
    <>
      {/* Hidden container for height measurement — same width as the content div */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          width: CONTENT_AREA_WIDTH_PX,
          fontFamily: 'Arial, sans-serif',
          color: '#1a1a1a',
        }}
      >
        {pageHeader && <div ref={headerMeasureRef}>{pageHeader}</div>}
        {allChildren}
      </div>
      {pages.map((pageChildren, pageIndex) => (
        <A4Page
          key={pageIndex}
          pageNumber={startPageNumber + pageIndex}
          quoteNumber={quoteNumber}
        >
          {pageHeader && contentContainerStyle ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              {pageHeader}
              <div
                style={{
                  ...contentContainerStyle,
                  flex: 1,
                  minHeight: 0,
                  position: 'relative',
                  isolation: 'isolate',
                }}
              >
                {contentWatermark && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: -1,
                    }}
                  >
                    {contentWatermark}
                  </div>
                )}
                {pageChildren}
              </div>
            </div>
          ) : (
            <>
              {pageHeader}
              {contentContainerStyle ? (
                <div
                  style={{
                    ...contentContainerStyle,
                    ...(contentWatermark
                      ? { position: 'relative' as const, isolation: 'isolate' }
                      : {}),
                  }}
                >
                  {contentWatermark && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: -1,
                      }}
                    >
                      {contentWatermark}
                    </div>
                  )}
                  {pageChildren}
                </div>
              ) : (
                pageChildren
              )}
            </>
          )}
        </A4Page>
      ))}
    </>
  )
}
