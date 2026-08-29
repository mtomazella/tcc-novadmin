import React, { useRef, useState } from 'react'
import type { QuoteFile } from '@novadmin/lib/types'
import { uploadQuoteFile } from 'services/api/quoteFileService'

interface ImageUploaderProps {
  quoteId: number
  onUploaded: (file: QuoteFile) => void
}

export default function ImageUploader({
  quoteId,
  onUploaded,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const base64Content = await readFileAsBase64(file)
        const uploaded = await uploadQuoteFile(
          quoteId,
          file.name,
          base64Content,
        )
        onUploaded(uploaded)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = event => {
        const dataUrl = event.target?.result as string
        // Strip the "data:image/xxx;base64," prefix — store raw base64
        const base64 = dataUrl.split(',')[1]
        if (!base64) reject(new Error('Failed to read file as base64'))
        else resolve(base64)
      }
      reader.onerror = () => reject(new Error('FileReader error'))
      reader.readAsDataURL(file)
    })

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    void handleFiles(event.dataTransfer.files)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleClick = () => fileInputRef.current?.click()

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${isDragOver ? '#7C3AED' : '#d1d5db'}`,
        borderRadius: '6px',
        padding: '12px',
        textAlign: 'center',
        cursor: isUploading ? 'wait' : 'pointer',
        color: '#6b7280',
        fontSize: '13px',
        transition: 'border-color 0.15s',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={event => void handleFiles(event.target.files)}
      />
      {isUploading ? 'Carregando...' : 'Adicionar imagens'}
    </div>
  )
}
