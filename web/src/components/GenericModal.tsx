import React, { useEffect } from 'react'

interface GenericModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onSave?: () => void
  saveButtonText?: string
  showCancelButton?: boolean
  isLoading?: boolean
  disableSave?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  zIndex?: number
  closeOnBackdropClick?: boolean
}

const GenericModal: React.FC<GenericModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saveButtonText = 'Salvar',
  showCancelButton = true,
  isLoading = false,
  disableSave = false,
  size = 'xl',
  zIndex = 100,
  closeOnBackdropClick = true,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnBackdropClick) onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEsc)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose, closeOnBackdropClick])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-[70%]',
  }[size]

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col transform transition-all duration-300`}
        style={{ zIndex: zIndex + 1 }}
        onClick={e => e.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="text-3xl lg:text-xl font-bold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors text-2xl lg:text-base"
            aria-label="Fechar modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-5 flex-grow overflow-y-auto">{children}</div>

        <div className="flex justify-end gap-3 p-5 bg-gray-50 rounded-b-xl border-t border-gray-200">
          {showCancelButton && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all text-2xl lg:text-base ${
                isLoading
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'hover:bg-gray-100 active:bg-gray-200'
              }`}
            >
              Cancelar
            </button>
          )}

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isLoading || disableSave}
              className={`text-2xl lg:text-base px-5 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center ${
                isLoading || disableSave
                  ? 'opacity-80 cursor-not-allowed'
                  : 'hover:from-violet-600 hover:to-violet-700 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                saveButtonText
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenericModal
