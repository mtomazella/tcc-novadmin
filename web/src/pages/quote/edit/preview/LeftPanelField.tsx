import React from 'react'
import {
  FIELD_DISPLAY_STYLE,
  FIELD_LABEL_STYLE,
  INPUT_STYLE,
} from './documentConstants'

export interface HistoricoRevision {
  label: string
  description: string
}

export function LeftPanelField({
  label,
  value,
  isEditing,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  isEditing: boolean
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <span style={FIELD_LABEL_STYLE}>{label}</span>
      {isEditing ? (
        <input
          style={INPUT_STYLE}
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
        />
      ) : (
        <div style={FIELD_DISPLAY_STYLE}>{value || '—'}</div>
      )}
    </div>
  )
}

export function RevisionListEditor({
  revisions,
  isEditing,
  onChange,
}: {
  revisions: HistoricoRevision[]
  isEditing: boolean
  onChange: (revisions: HistoricoRevision[]) => void
}) {
  const updateRevision = (
    index: number,
    field: keyof HistoricoRevision,
    value: string,
  ) => {
    onChange(
      revisions.map((revision, i) =>
        i === index ? { ...revision, [field]: value } : revision,
      ),
    )
  }

  const addRevision = () => {
    onChange([...revisions, { label: '', description: '' }])
  }

  const removeRevision = (index: number) => {
    onChange(revisions.filter((_, i) => i !== index))
  }

  return (
    <div>
      <span style={FIELD_LABEL_STYLE}>Revisões</span>
      {revisions.length === 0 && !isEditing && (
        <div style={FIELD_DISPLAY_STYLE}>—</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {revisions.map((revision, index) =>
          isEditing ? (
            <div
              key={index}
              style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
            >
              <input
                style={{ ...INPUT_STYLE, width: '60px', flexShrink: 0 }}
                value={revision.label}
                placeholder="R00"
                onChange={event =>
                  updateRevision(index, 'label', event.target.value)
                }
              />
              <input
                style={{ ...INPUT_STYLE, flex: 1 }}
                value={revision.description}
                placeholder="Descrição da revisão"
                onChange={event =>
                  updateRevision(index, 'description', event.target.value)
                }
              />
              <button
                type="button"
                onClick={() => removeRevision(index)}
                style={{
                  flexShrink: 0,
                  border: 'none',
                  background: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div key={index} style={{ ...FIELD_DISPLAY_STYLE, width: '100%' }}>
              <span style={{ fontWeight: 'bold', marginRight: '6px' }}>
                {revision.label || '—'}:
              </span>
              {revision.description || '—'}
            </div>
          ),
        )}
      </div>
      {isEditing && (
        <button
          type="button"
          onClick={addRevision}
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: 'white',
            background: '#7C3AED',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 'bold',
          }}
        >
          ＋ Adicionar revisão
        </button>
      )}
    </div>
  )
}
