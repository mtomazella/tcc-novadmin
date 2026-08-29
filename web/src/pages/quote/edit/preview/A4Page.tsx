import React from 'react'

export function A4Page({
  children,
  pageNumber,
  quoteNumber,
  onContentRef,
}: {
  children?: React.ReactNode
  pageNumber: number
  quoteNumber: string
  onContentRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      className="a4-page"
      style={{
        width: '210mm',
        height: '297mm',
        overflow: 'hidden',
        background: 'white',
        boxSizing: 'border-box',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        margin: '0 auto 24px',
        fontFamily: 'Arial, sans-serif',
        color: '#1a1a1a',
        padding: '12mm',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Orange border frame */}
      <div
        style={{
          border: '1mm solid #7C3AED',
          borderRadius: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header: quote number, right-aligned */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: '70mm',
              flexShrink: 0,
              marginRight: '18mm',
              marginTop: '8mm',
              fontSize: '14px',
              lineHeight: '1.3',
              textAlign: 'right',
            }}
          >
            <div
              style={{ fontWeight: 'bold', marginTop: '4px', color: '#000' }}
            >
              {quoteNumber}
            </div>
          </div>
        </div>

        {/* Main content — 15mm side padding inside the orange border */}
        <div
          ref={onContentRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: '15mm',
            paddingRight: '15mm',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>

        {/* Footer: page number */}
        <div
          style={{
            textAlign: 'right',
            width: '160mm',
            alignSelf: 'center',
            marginBottom: '2mm',
            fontSize: '12px',
            color: '#555',
          }}
        >
          {pageNumber}
        </div>
      </div>
    </div>
  )
}
