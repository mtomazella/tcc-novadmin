import React from 'react'
import type {
  DelimitacaoLegendItem,
  DelimitacaoSection,
  QuoteFile,
} from '@novadmin/lib/types'
import ImageUploader from '../../../../components/ImageUploader'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  FIELD_DISPLAY_STYLE,
  FIELD_LABEL_STYLE,
  FONT_SIZE_BODY,
  FONT_SIZE_CALLOUT,
  INPUT_STYLE,
  LIGHT_ORANGE_COLOR,
} from './documentConstants'

// ── Utilities ─────────────────────────────────────────────────────────────────

function detectImageMimeType(base64: unknown): string {
  if (typeof base64 !== 'string') return 'image/jpeg'
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBORw0K')) return 'image/png'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  if (base64.startsWith('UklGR')) return 'image/webp'
  return 'image/jpeg'
}

// ── Page-level components (used in the A4 pages, not the control panel) ───────

export function DelimitacaoLimitsTable({
  section,
}: {
  section: DelimitacaoSection
}) {
  const cellBorder = '1px solid #1a1a1a'
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '6mm',
        tableLayout: 'fixed',
      }}
    >
      <tbody>
        {/* Orange callout spanning both columns */}
        <tr>
          <td
            colSpan={2}
            style={{
              backgroundColor: '#7C3AED',
              border: cellBorder,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: FONT_SIZE_CALLOUT,
              color: '#1a1a1a',
              padding: '1mm',
            }}
          >
            LIMITES PREVISTOS PARA FORNECIMENTO
          </td>
        </tr>
        {/* Column headers */}
        <tr>
          <td
            style={{
              width: '65%',
              backgroundColor: LIGHT_ORANGE_COLOR,
              fontWeight: 'bold',
              fontSize: FONT_SIZE_BODY,
              padding: '1mm 2mm',
              border: cellBorder,
            }}
          >
            OBSERVAÇÕES
          </td>
          <td
            style={{
              backgroundColor: LIGHT_ORANGE_COLOR,
              fontWeight: 'bold',
              fontSize: FONT_SIZE_BODY,
              padding: '1mm 2mm',
              border: cellBorder,
            }}
          >
            LEGENDA
          </td>
        </tr>
        {/* Content */}
        <tr>
          <td
            style={{
              fontSize: FONT_SIZE_BODY,
              padding: '2mm',
              border: cellBorder,
              verticalAlign: 'top',
              whiteSpace: 'pre-wrap',
            }}
          >
            {section.observacoesText || ''}
          </td>
          <td
            style={{
              fontSize: FONT_SIZE_BODY,
              padding: '2mm',
              border: cellBorder,
              verticalAlign: 'top',
            }}
          >
            {section.legendItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3mm',
                  marginBottom: '1mm',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <span>{item.text}</span>
              </div>
            ))}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function DelimitacaoImageBlock({
  fileId,
  scale,
  quoteFileContents,
  onRequestFileContent,
}: {
  fileId: number
  scale: number
  quoteFileContents: Map<number, string>
  onRequestFileContent: (id: number) => void
}) {
  const dataUri = quoteFileContents.get(fileId)
  if (!dataUri) {
    onRequestFileContent(fileId)
    return (
      <div
        style={{ marginTop: '4mm', display: 'flex', justifyContent: 'center' }}
      >
        <div
          style={{
            width: `${scale}%`,
            height: '60mm',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: FONT_SIZE_BODY,
            color: '#9ca3af',
          }}
        >
          Carregando imagem...
        </div>
      </div>
    )
  }
  return (
    <div
      style={{ marginTop: '4mm', display: 'flex', justifyContent: 'center' }}
    >
      <img
        src={`data:${detectImageMimeType(dataUri)};base64,${dataUri}`}
        style={{ width: `${scale}%`, display: 'block' }}
        alt=""
      />
    </div>
  )
}

// ── Left-panel file row components ───────────────────────────────────────────

function DelimitacaoSelectedFileRow({
  file,
  scale,
  isEditing,
  onDeselect,
  onDelete,
  onScaleChange,
}: {
  file: QuoteFile
  scale: number
  isEditing: boolean
  onDeselect: () => void
  onDelete: () => void
  onScaleChange: (scale: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: String(file.id ?? file.name),
    })
  const [inputValue, setInputValue] = React.useState(String(scale))

  React.useEffect(() => {
    setInputValue(String(scale))
  }, [scale])

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 0',
      }}
    >
      {isEditing && (
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            color: '#9ca3af',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          ⠿
        </span>
      )}
      <input
        type="checkbox"
        checked
        disabled={!isEditing}
        onChange={onDeselect}
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          flex: 1,
          fontSize: '14px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {file.name}
      </span>
      {isEditing ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            flexShrink: 0,
          }}
        >
          <input
            type="number"
            min={1}
            max={100}
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            onBlur={() => {
              const parsed = Number(inputValue)
              const clamped = Number.isFinite(parsed)
                ? Math.min(100, Math.max(1, parsed))
                : scale
              setInputValue(String(clamped))
              onScaleChange(clamped)
            }}
            style={{
              width: '56px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '2px 4px',
              textAlign: 'left',
            }}
          />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>%</span>
        </div>
      ) : (
        <span style={{ fontSize: '14px', color: '#6b7280', flexShrink: 0 }}>
          {scale}%
        </span>
      )}
      {isEditing && (
        <button
          onClick={onDelete}
          style={{
            color: '#ef4444',
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

function DelimitacaoUnselectedFileRow({
  file,
  onSelect,
  onDelete,
}: {
  file: QuoteFile
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 0',
      }}
    >
      <span style={{ width: '14px', flexShrink: 0 }} />
      <input
        type="checkbox"
        checked={false}
        onChange={onSelect}
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          flex: 1,
          fontSize: '14px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#6b7280',
        }}
      >
        {file.name}
      </span>
      <button
        onClick={onDelete}
        style={{
          color: '#ef4444',
          fontSize: '14px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}

// ── Main control group ────────────────────────────────────────────────────────

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#374151',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '4px',
}

export function DelimitacaoControlGroup({
  section,
  quoteFileList,
  isEditing,
  onUpdate,
  onRemove,
  onFileUploaded,
  onFileDeleted,
  quoteId,
}: {
  section: DelimitacaoSection
  quoteFileList: QuoteFile[]
  isEditing: boolean
  onUpdate: (updates: Partial<DelimitacaoSection>) => void
  onRemove: () => void
  onFileUploaded: (file: QuoteFile) => void
  onFileDeleted: (id: number) => void
  quoteId: number
}) {
  const dndSensors = useSensors(useSensor(PointerSensor))

  const selectedFiles = section.selectedFileIds
    .map(id => quoteFileList.find(file => file.id === id))
    .filter((file): file is QuoteFile => file != null)
  const unselectedFiles = quoteFileList.filter(
    file => !section.selectedFileIds.includes(file.id as number),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeFileId = Number(active.id)
    const overFileId = Number(over.id)
    const oldIndex = section.selectedFileIds.indexOf(activeFileId)
    const newIndex = section.selectedFileIds.indexOf(overFileId)
    if (oldIndex === -1 || newIndex === -1) return
    onUpdate({
      selectedFileIds: arrayMove(section.selectedFileIds, oldIndex, newIndex),
    })
  }

  const addLegendItem = () => {
    onUpdate({
      legendItems: [
        ...section.legendItems,
        { color: '#7C3AED', text: '' } satisfies DelimitacaoLegendItem,
      ],
    })
  }

  const updateLegendItem = (
    index: number,
    updates: Partial<DelimitacaoLegendItem>,
  ) => {
    onUpdate({
      legendItems: section.legendItems.map((item, i) =>
        i === index ? { ...item, ...updates } : item,
      ),
    })
  }

  return (
    <div
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* Title */}
      <div>
        <label style={SECTION_LABEL_STYLE}>TÍTULO</label>
        {isEditing ? (
          <input
            value={section.title}
            onChange={event => onUpdate({ title: event.target.value })}
            placeholder="DELIMITAÇÃO"
            style={{
              width: '100%',
              padding: '4px 6px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        ) : (
          <div style={FIELD_DISPLAY_STYLE}>
            {section.title || 'DELIMITAÇÃO'}
          </div>
        )}
      </div>

      {/* Observações */}
      <div>
        <label style={SECTION_LABEL_STYLE}>OBSERVAÇÕES</label>
        {isEditing ? (
          <textarea
            value={section.observacoesText}
            onChange={event =>
              onUpdate({ observacoesText: event.target.value })
            }
            rows={4}
            style={{
              width: '100%',
              padding: '4px 6px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        ) : (
          <div style={{ ...FIELD_DISPLAY_STYLE, whiteSpace: 'pre-wrap' }}>
            {section.observacoesText || '—'}
          </div>
        )}
      </div>

      {/* Legend */}
      <div>
        <label style={SECTION_LABEL_STYLE}>LEGENDA</label>
        {section.legendItems.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            {isEditing ? (
              <>
                <input
                  type="color"
                  value={item.color}
                  onChange={event =>
                    updateLegendItem(index, { color: event.target.value })
                  }
                  style={{
                    width: '28px',
                    height: '28px',
                    padding: '0',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <input
                  value={item.text}
                  onChange={event =>
                    updateLegendItem(index, { text: event.target.value })
                  }
                  placeholder="Descrição"
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={() =>
                    onUpdate({
                      legendItems: section.legendItems.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                  style={{
                    color: '#ef4444',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '14px' }}>{item.text || '—'}</span>
              </>
            )}
          </div>
        ))}
        {section.legendItems.length === 0 && !isEditing && (
          <div style={FIELD_DISPLAY_STYLE}>—</div>
        )}
        {isEditing && (
          <button
            onClick={addLegendItem}
            style={{
              fontSize: '14px',
              color: '#ffffff',
              background: '#7C3AED',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            + Adicionar legenda
          </button>
        )}
      </div>

      {/* Images — selected (sortable) then unselected */}
      <div>
        <label style={SECTION_LABEL_STYLE}>IMAGENS</label>
        {isEditing && (
          <ImageUploader quoteId={quoteId} onUploaded={onFileUploaded} />
        )}

        <DndContext
          sensors={dndSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedFiles.map(file => String(file.id ?? file.name))}
            strategy={verticalListSortingStrategy}
          >
            {selectedFiles.map(file => (
              <DelimitacaoSelectedFileRow
                key={file.id ?? file.name}
                file={file}
                scale={section.fileScales?.[String(file.id)] ?? 100}
                isEditing={isEditing}
                onDeselect={() =>
                  onUpdate({
                    selectedFileIds: section.selectedFileIds.filter(
                      id => id !== file.id,
                    ),
                  })
                }
                onDelete={() => onFileDeleted(file.id as number)}
                onScaleChange={scale =>
                  onUpdate({
                    fileScales: {
                      ...(section.fileScales ?? {}),
                      [String(file.id)]: scale,
                    },
                  })
                }
              />
            ))}
          </SortableContext>
        </DndContext>

        {isEditing &&
          unselectedFiles.map(file => (
            <DelimitacaoUnselectedFileRow
              key={file.id ?? file.name}
              file={file}
              onSelect={() =>
                onUpdate({
                  selectedFileIds: [
                    ...section.selectedFileIds,
                    file.id as number,
                  ],
                })
              }
              onDelete={() => onFileDeleted(file.id as number)}
            />
          ))}

        {quoteFileList.length === 0 && !isEditing && (
          <div style={FIELD_DISPLAY_STYLE}>—</div>
        )}
      </div>

      {isEditing && (
        <button
          onClick={onRemove}
          style={{
            fontSize: '14px',
            color: '#ffffff',
            background: '#ef4444',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 8px',
            cursor: 'pointer',
            marginTop: '4px',
            width: '100%',
          }}
        >
          Remover seção
        </button>
      )}
    </div>
  )
}
