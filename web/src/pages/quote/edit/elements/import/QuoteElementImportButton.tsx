import { useRef, useState } from 'react'
import { FiFile, FiUploadCloud, FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import {
  buildImportRequestBody,
  groupImportRowsByScope,
  normalizeScopeName,
  parseImportGrid,
} from '@novadmin/lib/quote/import'
import type {
  ImportGroupSelection,
  ImportScopeGroup,
} from '@novadmin/lib/quote/import'
import GenericModal from 'components/GenericModal'
import { importQuoteScopesAndElements } from 'services/api/quoteImportService'
import {
  getQuoteScopes,
  lockQuoteElements,
  unlockQuoteElements,
} from 'services/api/quoteService'
import type { Product } from 'types/product'
import { pickDefaultProductForType } from '../shared'
import { readFileAsGrid } from './readImportFile'

interface QuoteElementImportButtonProps {
  quoteId: number
  products: Product[]
  onImported: () => void
}

type ImportPhase = 'upload' | 'review'

const buildDefaultSelections = (
  groups: ImportScopeGroup[],
): Record<string, ImportGroupSelection> =>
  Object.fromEntries(
    groups.map(group => [
      group.scopeName,
      {
        scopeName: group.scopeName,
        targetScopeName: group.scopeName,
        createScope: true,
        includePilares: group.pilares.length > 0,
        includeVigas: group.vigas.length > 0,
        includeLajes: group.lajes.length > 0,
      },
    ]),
  )

const fileKey = (file: File) => `${file.name}__${file.size}`

const QuoteElementImportButton: React.FC<QuoteElementImportButtonProps> = ({
  quoteId,
  products,
  onImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [phase, setPhase] = useState<ImportPhase>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [groups, setGroups] = useState<ImportScopeGroup[]>([])
  const [selections, setSelections] = useState<
    Record<string, ImportGroupSelection>
  >({})
  const [existingScopesByNormalizedName, setExistingScopesByNormalizedName] =
    useState<Map<string, number>>(new Map())

  const resetState = () => {
    setPhase('upload')
    setPendingFiles([])
    setGroups([])
    setSelections({})
    setExistingScopesByNormalizedName(new Map())
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const addFiles = (incoming: FileList | File[]) => {
    setPendingFiles(prev => {
      const byKey = new Map(prev.map(file => [fileKey(file), file]))
      Array.from(incoming).forEach(file => byKey.set(fileKey(file), file))
      return Array.from(byKey.values())
    })
  }

  const removeFile = (key: string) => {
    setPendingFiles(prev => prev.filter(file => fileKey(file) !== key))
  }

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (files && files.length > 0) {
      addFiles(Array.from(files))
    }
    // Deferred so the FileList isn't cleared before React processes the update above.
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }, 0)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      addFiles(files)
    }
  }

  const handleProcessPendingFiles = async () => {
    if (pendingFiles.length === 0) return

    setIsParsing(true)
    try {
      const allRows = (
        await Promise.all(
          pendingFiles.map(async file => {
            const grid = await readFileAsGrid(file)
            return parseImportGrid(grid)
          }),
        )
      ).flat()

      if (allRows.length === 0) {
        toast.warning('Nenhum elemento encontrado nos arquivos selecionados.')
        return
      }

      const existingScopesResponse = await getQuoteScopes({
        quoteId,
        activationStatus: 'active',
      })
      const nextExistingScopesByNormalizedName = new Map(
        existingScopesResponse.data
          .filter(
            (scope): scope is typeof scope & { id: number } =>
              scope.id !== undefined,
          )
          .map(scope => [normalizeScopeName(scope.name), scope.id]),
      )

      const nextGroups = groupImportRowsByScope(allRows)
      setGroups(nextGroups)
      setSelections(buildDefaultSelections(nextGroups))
      setExistingScopesByNormalizedName(nextExistingScopesByNormalizedName)
      setPhase('review')
    } catch (error) {
      toast.error(
        (error as Error)?.message ||
          'Erro ao processar os arquivos importados.',
      )
    } finally {
      setIsParsing(false)
    }
  }

  const toggleCreateScope = (scopeName: string) => {
    setSelections(prev => ({
      ...prev,
      [scopeName]: {
        ...prev[scopeName],
        createScope: !prev[scopeName].createScope,
      },
    }))
  }

  const toggleFamily = (
    scopeName: string,
    family: 'includePilares' | 'includeVigas' | 'includeLajes',
  ) => {
    setSelections(prev => ({
      ...prev,
      [scopeName]: {
        ...prev[scopeName],
        [family]: !prev[scopeName][family],
      },
    }))
  }

  const updateTargetScopeName = (scopeName: string, value: string) => {
    setSelections(prev => ({
      ...prev,
      [scopeName]: {
        ...prev[scopeName],
        targetScopeName: value,
      },
    }))
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetState()
  }

  const handleConfirmImport = async () => {
    const selectedGroups = groups.filter(group => {
      const selection = selections[group.scopeName]
      return (
        selection &&
        (selection.includePilares ||
          selection.includeVigas ||
          selection.includeLajes)
      )
    })

    if (selectedGroups.length === 0) {
      toast.warning('Selecione ao menos um grupo de elementos para importar.')
      return
    }

    const pilarProduct = pickDefaultProductForType('pilar', products)
    const vigaProduct = pickDefaultProductForType('viga', products)
    const lajeProduct = pickDefaultProductForType('laje', products)

    if (
      (selectedGroups.some(group => group.pilares.length > 0) &&
        !pilarProduct) ||
      (selectedGroups.some(group => group.vigas.length > 0) && !vigaProduct) ||
      (selectedGroups.some(group => group.lajes.length > 0) && !lajeProduct)
    ) {
      toast.error(
        'Não foi possível encontrar um produto padrão para um dos tipos de elemento.',
      )
      return
    }

    setIsImporting(true)
    try {
      await lockQuoteElements({ id: quoteId })
    } catch (error) {
      toast.error(
        (error as Error)?.message ||
          'Não foi possível bloquear os elementos para importação.',
      )
      setIsImporting(false)
      return
    }

    try {
      const body = buildImportRequestBody({
        quoteId,
        groups: selectedGroups,
        selections: Object.values(selections),
        productIdByType: {
          pilar: Number(pilarProduct?.id ?? 0),
          viga: Number(vigaProduct?.id ?? 0),
          laje: Number(lajeProduct?.id ?? 0),
        },
        existingScopesByNormalizedName,
      })

      const result = await importQuoteScopesAndElements(body)

      toast.success(
        `Importação concluída: ${result.scopes.length} escopo(s), ${result.elements.length} elemento(s).`,
      )
      setIsModalOpen(false)
      resetState()
      onImported()
    } catch (error) {
      toast.error((error as Error)?.message || 'Erro ao importar elementos.')
    } finally {
      try {
        await unlockQuoteElements({ id: quoteId })
      } catch (error) {
        console.error('Failed to release element lock after import:', error)
      }
      setIsImporting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <FiUploadCloud />
        Importar Planilha
      </button>

      <GenericModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Importar Elementos"
        size="xl"
        showCancelButton={phase === 'upload'}
        onSave={
          phase === 'upload'
            ? () => void handleProcessPendingFiles()
            : () => void handleConfirmImport()
        }
        saveButtonText={
          phase === 'upload' ? 'Continuar' : 'Importar selecionados'
        }
        isLoading={phase === 'upload' ? isParsing : isImporting}
        disableSave={
          phase === 'upload'
            ? pendingFiles.length === 0
            : !Object.values(selections).some(
                selection =>
                  selection.includePilares ||
                  selection.includeVigas ||
                  selection.includeLajes,
              ) ||
              Object.values(selections).some(
                selection =>
                  selection.createScope &&
                  (selection.includePilares ||
                    selection.includeVigas ||
                    selection.includeLajes) &&
                  !selection.targetScopeName.trim(),
              )
        }
      >
        {phase === 'upload' ? (
          <div className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={openFileDialog}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openFileDialog()
                }
              }}
              onDragEnter={event => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={event => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={event => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-[#7C3AED] bg-violet-50'
                  : 'border-gray-300 hover:border-[#7C3AED] hover:bg-violet-50/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,text/csv"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="flex flex-col items-center justify-center gap-2 text-gray-600">
                <FiUploadCloud className="h-8 w-8 text-[#7C3AED]" />
                <p className="text-sm font-medium text-gray-700">
                  Arraste seus arquivos aqui
                </p>
                <p className="text-sm text-gray-500">
                  ou clique para selecionar arquivos de pilares, vigas e/ou
                  lajes (CSV/XLSX)
                </p>
              </div>
            </div>

            {pendingFiles.length > 0 && (
              <div className="rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                  Arquivos selecionados ({pendingFiles.length})
                </div>
                <ul className="divide-y divide-gray-100">
                  {pendingFiles.map(file => (
                    <li
                      key={fileKey(file)}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-gray-700"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FiFile className="shrink-0 text-gray-400" />
                        <span className="truncate">{file.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(fileKey(file))}
                        disabled={isParsing}
                        className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remover ${file.name}`}
                      >
                        <FiX />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Adicione quantos arquivos forem necessários e clique em
              "Continuar" quando terminar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
              {groups.length} escopo(s) detectado(s) em quote {quoteId}.
            </div>

            <div className="space-y-3">
              {groups.map(group => {
                const selection = selections[group.scopeName]
                if (!selection) return null

                return (
                  <div
                    key={group.scopeName}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <label className="flex items-center gap-2 font-medium text-gray-800">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-[#7C3AED] rounded focus:ring-[#7C3AED]"
                        checked={selection.createScope}
                        onChange={() => toggleCreateScope(group.scopeName)}
                      />
                      Associar elementos a um escopo
                    </label>

                    {selection.createScope && (
                      <div className="mt-2 pl-6">
                        <input
                          type="text"
                          value={selection.targetScopeName}
                          onChange={event =>
                            updateTargetScopeName(
                              group.scopeName,
                              event.target.value,
                            )
                          }
                          placeholder="Nome do escopo"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-[#7C3AED] focus:outline-none"
                        />
                        <p
                          className={`mt-1 text-xs ${
                            existingScopesByNormalizedName.has(
                              normalizeScopeName(selection.targetScopeName),
                            )
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {existingScopesByNormalizedName.has(
                            normalizeScopeName(selection.targetScopeName),
                          )
                            ? '✓ Escopo existente — elementos serão adicionados a ele'
                            : 'Novo escopo será criado'}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-4 pl-6 text-sm text-gray-700">
                      {group.pilares.length > 0 && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-[#7C3AED] rounded focus:ring-[#7C3AED]"
                            checked={selection.includePilares}
                            onChange={() =>
                              toggleFamily(group.scopeName, 'includePilares')
                            }
                          />
                          Pilares ({group.pilares.length})
                        </label>
                      )}
                      {group.vigas.length > 0 && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-[#7C3AED] rounded focus:ring-[#7C3AED]"
                            checked={selection.includeVigas}
                            onChange={() =>
                              toggleFamily(group.scopeName, 'includeVigas')
                            }
                          />
                          Vigas ({group.vigas.length})
                        </label>
                      )}
                      {group.lajes.length > 0 && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-[#7C3AED] rounded focus:ring-[#7C3AED]"
                            checked={selection.includeLajes}
                            onChange={() =>
                              toggleFamily(group.scopeName, 'includeLajes')
                            }
                          />
                          Lajes ({group.lajes.length})
                        </label>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </GenericModal>
    </>
  )
}

export default QuoteElementImportButton
