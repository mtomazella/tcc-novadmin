import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-toastify'
import type { TabLeaveGuardHandle } from './ElementsTab'
import {
  getQuoteById,
  getQuoteElements,
  getQuoteScopes,
  lockQuoteDocument,
  unlockQuoteDocument,
  updateQuoteDocument,
} from 'services/api/quoteService'
import type { QuoteApiItem } from 'types/quote'
import DocumentEditor from './preview/DocumentEditor'
import DocumentPreview from './preview/DocumentPreview'
import PreviewControls from './preview/PreviewControls'
import { exportToDocx } from './preview/docx/exportDocx'
import type {
  DelimitacaoSection,
  QuoteElement,
  QuoteFile,
  QuoteScope,
  QuoteScopeProductSnapshotMap,
} from '@novadmin/lib/types'
import {
  deleteQuoteFile,
  getQuoteFileWithContent,
  getQuoteFiles,
} from 'services/api/quoteFileService'
import { getPricingOptions } from 'services/api/pricingOptionService'
import { pricingOptions as pricingOptionsLib } from '@novadmin/lib/quote'
import type { QuotePricingOptionRow } from '@novadmin/lib/quote/pricingOptions'

interface PreviewTabProps {
  quoteId: number
  onDirtyStateChange?: (dirty: boolean) => void
  readOnly?: boolean
}

const PreviewTab = forwardRef<TabLeaveGuardHandle, PreviewTabProps>(
  function PreviewTab({ quoteId, onDirtyStateChange, readOnly }, ref) {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [quoteData, setQuoteData] = useState<QuoteApiItem | null>(null)
    const [documentOptions, setDocumentOptions] = useState<
      Record<string, unknown>
    >({})
    const [quoteFileList, setQuoteFileList] = useState<QuoteFile[]>([])
    const [quoteFileContents, setQuoteFileContents] = useState<
      Map<number, string>
    >(new Map())
    const [scopeList, setScopeList] = useState<QuoteScope[]>([])
    const [scopeElements, setScopeElements] = useState<QuoteElement[]>([])

    const [selectedPricingOption, setSelectedPricingOption] =
      useState<QuotePricingOptionRow | null>(null)

    const lockAcquiredRef = useRef(false)
    const [lockAcquired, setLockAcquired] = useState(false)

    // ── Data loading ────────────────────────────────────────────────────────

    useEffect(() => {
      void (async () => {
        setIsLoading(true)
        try {
          const quoteResponse = await getQuoteById(quoteId)
          const currentQuote = quoteResponse.data?.[0] ?? null
          setQuoteData(currentQuote)
          const loadedOptions =
            (currentQuote?.documentOptions as Record<string, unknown>) ?? {}
          const existingSections = (loadedOptions.delimitacaoSections ??
            []) as unknown[]
          if (existingSections.length === 0) {
            loadedOptions.delimitacaoSections = [
              {
                id: crypto.randomUUID(),
                title: 'DELIMITAÇÃO',
                observacoesText: '',
                legendItems: [],
                selectedFileIds: [],
              },
            ]
          }
          setDocumentOptions(loadedOptions)
          const [basePricingOptionsResponse, scopesResponse, elementsResponse] =
            await Promise.all([
              getPricingOptions(),
              getQuoteScopes({ quoteId }),
              getQuoteElements({ quoteId }),
            ])

          const pricingOptionRows = pricingOptionsLib.toQuotePricingOptionRows({
            basePricingOptions: basePricingOptionsResponse.data ?? [],
            overriddenPricingOptions:
              (currentQuote?.pricingOptions as unknown as any[]) ?? [],
          })
          const resolvedSelectedPricingOption =
            pricingOptionRows.find(
              row => row.id === currentQuote?.selectedPricingOptionId,
            ) ?? null
          setSelectedPricingOption(resolvedSelectedPricingOption)

          setScopeList(scopesResponse.data ?? [])
          setScopeElements(elementsResponse.data ?? [])
        } catch (error) {
          toast.error(
            (error as Error)?.message || 'Erro ao carregar dados do documento',
          )
        } finally {
          setIsLoading(false)
        }
      })()
    }, [quoteId])

    useEffect(() => {
      void (async () => {
        try {
          const files = await getQuoteFiles(quoteId)
          setQuoteFileList(files)
        } catch {
          // non-fatal — sections without content still render placeholder boxes
        }
      })()
    }, [quoteId])

    // ── Dirty state propagation ─────────────────────────────────────────────

    useEffect(() => {
      onDirtyStateChange?.(lockAcquired)
    }, [lockAcquired, onDirtyStateChange])

    // ── Lock helpers ────────────────────────────────────────────────────────

    const releaseDocumentLock = useCallback(async (): Promise<boolean> => {
      if (!lockAcquiredRef.current) return true
      try {
        await unlockQuoteDocument({ id: quoteId })
        lockAcquiredRef.current = false
        setLockAcquired(false)
        return true
      } catch (error) {
        toast.error(
          (error as Error)?.message ||
            'Não foi possível desbloquear o documento',
        )
        return false
      }
    }, [quoteId])

    // ── Edit / Save / Cancel ────────────────────────────────────────────────

    const handleEdit = async () => {
      try {
        await lockQuoteDocument({ id: quoteId })
        lockAcquiredRef.current = true
        setLockAcquired(true)
        setIsEditing(true)
      } catch (error) {
        toast.error(
          (error as Error)?.message || 'Não foi possível bloquear o documento',
        )
      }
    }

    const handleSave = useCallback(async (): Promise<boolean> => {
      setIsSaving(true)
      try {
        await updateQuoteDocument({
          record: { id: quoteId, documentOptions },
        })
        await releaseDocumentLock()
        setIsEditing(false)
        toast.success('Documento atualizado com sucesso')
        return true
      } catch (error) {
        toast.error((error as Error)?.message || 'Erro ao salvar documento')
        return false
      } finally {
        setIsSaving(false)
      }
    }, [quoteId, documentOptions, releaseDocumentLock])

    const handleCancel = useCallback(async (): Promise<boolean> => {
      const released = await releaseDocumentLock()
      if (released) {
        setDocumentOptions(
          (quoteData?.documentOptions as Record<string, unknown>) ?? {},
        )
        setIsEditing(false)
      }
      return released
    }, [releaseDocumentLock, quoteData])

    // ── Tab-switch leave guard ──────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      isDirty: () => lockAcquiredRef.current,
      saveBeforeLeave: () => handleSave(),
      discardBeforeLeave: () => handleCancel(),
    }))

    // ── Browser close guard ─────────────────────────────────────────────────

    useEffect(() => {
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!lockAcquiredRef.current) return
        event.preventDefault()
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [])

    useEffect(() => {
      const handlePageHide = (event: PageTransitionEvent) => {
        if (!lockAcquiredRef.current || event.persisted) return
        const token = localStorage.getItem('authToken')
        const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
        fetch(`${baseUrl}/quote/unlock/document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: quoteId }),
          keepalive: true,
        }).catch(() => {})
      }
      window.addEventListener('pagehide', handlePageHide)
      return () => window.removeEventListener('pagehide', handlePageHide)
    }, [quoteId])

    // ── File callbacks ─────────────────────────────────────────────────────

    const handleRequestFileContent = useCallback(
      async (fileId: number) => {
        if (quoteFileContents.has(fileId)) return
        try {
          const file = await getQuoteFileWithContent(fileId)
          if (!file.fileContent) return
          setQuoteFileContents(previous => {
            const updated = new Map(previous)
            updated.set(fileId, file.fileContent as string)
            return updated
          })
        } catch {
          // ignore — image renders placeholder
        }
      },
      [quoteFileContents],
    )

    const handleFileUploaded = useCallback((file: QuoteFile) => {
      setQuoteFileList(previous => [...previous, file])
    }, [])

    const handleFileDeleted = useCallback(async (fileId: number) => {
      try {
        await deleteQuoteFile(fileId)
        setQuoteFileList(previous =>
          previous.filter(file => file.id !== fileId),
        )
        setDocumentOptions(previous => {
          const delimitacaoSections = (
            (previous.delimitacaoSections ?? []) as DelimitacaoSection[]
          ).map(section => ({
            ...section,
            selectedFileIds: section.selectedFileIds.filter(
              id => id !== fileId,
            ),
          }))
          return { ...previous, delimitacaoSections }
        })
      } catch {
        toast.error('Erro ao excluir imagem')
      }
    }, [])

    // ── Export ─────────────────────────────────────────────────────────────

    const handleExportPdf = () => {
      const pagesContainer = document.querySelector(
        '.document-a4-pages',
      ) as HTMLElement | null
      if (!pagesContainer) {
        window.print()
        return
      }

      const iframe = document.createElement('iframe')
      iframe.style.cssText =
        'position:fixed;right:0;bottom:0;width:0;height:0;border:none;'
      document.body.appendChild(iframe)

      const iframeDocument = iframe.contentWindow?.document
      if (!iframeDocument) {
        document.body.removeChild(iframe)
        window.print()
        return
      }

      iframeDocument.write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
          '* { margin: 0; padding: 0; box-sizing: border-box;' +
          ' print-color-adjust: exact; -webkit-print-color-adjust: exact; }' +
          'body { background: white; font-family: Arial, sans-serif; }' +
          '@page { margin: 0; size: A4; }' +
          '.a4-page { margin: 0 auto !important; box-shadow: none !important; }' +
          '.document-rich-content h1, .document-rich-content h2 { font-size: 12pt; font-weight: bold; margin: 2mm 0; }' +
          '.document-rich-content h1 { text-align: center; }' +
          '.document-rich-content p, .document-rich-content li { text-align: justify; line-height: 1.2; margin: 0; }' +
          '.document-rich-content ul { list-style-type: disc; padding-left: 1.5em; }' +
          '.document-rich-content ol { list-style-type: decimal; padding-left: 1.5em; }' +
          '.document-rich-content ul > li + li { margin: 0.25em 0; }' +
          '.document-rich-content ol > li { margin: 0.5em 0; }' +
          '.document-rich-content ol > li:has(> p > strong:first-child)::marker { font-weight: bold; }' +
          '.document-rich-content p:empty { min-height: 1.2em; }' +
          '</style></head><body>' +
          pagesContainer.innerHTML +
          '</body></html>',
      )
      iframeDocument.close()

      const images = Array.from(iframeDocument.querySelectorAll('img'))
      const pendingImages = images.filter(img => !img.complete)

      const doPrint = () => {
        iframe.contentWindow?.print()
        document.body.removeChild(iframe)
      }

      if (pendingImages.length === 0) {
        doPrint()
        return
      }

      let remainingCount = pendingImages.length
      pendingImages.forEach(img => {
        const onDone = () => {
          remainingCount--
          if (remainingCount === 0) doPrint()
        }
        img.onload = onDone
        img.onerror = onDone
      })
    }

    const handleExportDocx = async () => {
      try {
        const delimitacaoSections = (documentOptions.delimitacaoSections ??
          []) as DelimitacaoSection[]
        const referencedFileIds = new Set(
          delimitacaoSections.flatMap(section => section.selectedFileIds),
        )

        const quoteFilesWithContent = await Promise.all(
          Array.from(referencedFileIds).map(id => getQuoteFileWithContent(id)),
        )

        await exportToDocx(quoteData?.formattedQuoteNumber ?? 'proposta', {
          quoteNumber: quoteData?.formattedQuoteNumber ?? '',
          clientName: quoteData?.client?.name ?? '',
          obraName: quoteData?.obra?.name ?? '',
          documentOptions,
          quoteFiles: quoteFilesWithContent
            .filter(file => file.fileContent != null)
            .map(file => ({
              id: file.id as number,
              name: file.name,
              fileContent: file.fileContent as string,
            })),
          scopes: scopeList,
          scopeElements,
          selectedPricingOption,
        })
      } catch (error) {
        toast.error((error as Error)?.message || 'Erro ao exportar DOCX')
      }
    }

    // ── Render ──────────────────────────────────────────────────────────────

    if (isLoading) return null

    const isDocumentLockedByAnotherUser =
      quoteData?.isDocumentLockedByAnotherUser ?? false

    const sharedProps = {
      quoteNumber: quoteData?.formattedQuoteNumber ?? '',
      clientName: quoteData?.client?.name ?? '',
      obraName: quoteData?.obra?.name ?? '',
      documentOptions,
      scopes: scopeList,
      scopeElements,
      quoteProducts: (quoteData?.products ??
        {}) as QuoteScopeProductSnapshotMap,
      selectedPricingOption,
    }

    return (
      <div className="flex h-full flex-col">
        <PreviewControls
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(previous => !previous)}
          isEditing={isEditing}
          isSaving={isSaving}
          isDocumentLockedByAnotherUser={isDocumentLockedByAnotherUser}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onExportPdf={handleExportPdf}
          onExportDocx={handleExportDocx}
          readOnly={readOnly}
        />

        {/* Screen: editor with aligned controls */}
        <div className="document-editor-view flex-1 overflow-auto bg-gray-50">
          <DocumentEditor
            {...sharedProps}
            quoteId={quoteId}
            quoteFileList={quoteFileList}
            quoteFileContents={quoteFileContents}
            onRequestFileContent={handleRequestFileContent}
            onFileUploaded={handleFileUploaded}
            onFileDeleted={handleFileDeleted}
            isEditing={isEditing}
            isCollapsed={isCollapsed}
            onChange={setDocumentOptions}
          />
        </div>

        {/* Print / DOCX target: clean A4 document, hidden on screen */}
        <div className="document-print-view">
          <DocumentPreview {...sharedProps} />
        </div>
      </div>
    )
  },
)

export default PreviewTab
