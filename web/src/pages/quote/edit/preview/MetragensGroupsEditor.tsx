import React from 'react'
import type { AreaOrderGroup, QuoteScope } from '@novadmin/lib/types'
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
import { FIELD_LABEL_STYLE, INPUT_STYLE } from './documentConstants'

function SortableScopeChip({
  scopeId,
  scopeMap,
  isEditing,
}: {
  scopeId: number
  scopeMap: Map<number, QuoteScope>
  isEditing: boolean
}) {
  const scope = scopeMap.get(scopeId)
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `scope-${scopeId}` })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 6px',
        marginTop: '4px',
        background: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#374151',
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
      <span>{scope?.name ?? `Escopo ${scopeId}`}</span>
    </div>
  )
}

function SortableGroupCard({
  group,
  isEditing,
  canDelete,
  onNameChange,
  onDelete,
  children,
}: {
  group: AreaOrderGroup
  isEditing: boolean
  canDelete: boolean
  onNameChange: (name: string) => void
  onDelete: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `group-${group.id}` })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        padding: '8px',
        marginBottom: '8px',
        background: '#f9fafb',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '6px',
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
        {isEditing ? (
          <input
            value={group.name}
            onChange={e => onNameChange(e.target.value)}
            style={{ ...INPUT_STYLE, flex: 1, fontWeight: 600 }}
          />
        ) : (
          <span style={{ ...FIELD_LABEL_STYLE, marginBottom: 0, flex: 1 }}>
            {group.name}
          </span>
        )}
        {isEditing && (
          <button
            onClick={onDelete}
            disabled={!canDelete}
            title="Remover grupo"
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: canDelete ? 'pointer' : 'not-allowed',
              color: canDelete ? '#ef4444' : '#d1d5db',
              fontSize: '16px',
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            ×
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

interface MetragensGroupsEditorProps {
  groups: AreaOrderGroup[]
  scopes: QuoteScope[]
  isEditing: boolean
  onChange: (groups: AreaOrderGroup[]) => void
}

export default function MetragensGroupsEditor({
  groups,
  scopes,
  isEditing,
  onChange,
}: MetragensGroupsEditorProps) {
  const scopeMap = React.useMemo(
    () => new Map(scopes.map(scope => [scope.id!, scope])),
    [scopes],
  )
  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIdString = String(active.id)
    const overIdString = String(over.id)

    if (activeIdString.startsWith('group-')) {
      const activeIndex = groups.findIndex(
        group => `group-${group.id}` === activeIdString,
      )
      const overIndex = groups.findIndex(
        group => `group-${group.id}` === overIdString,
      )
      if (activeIndex === -1 || overIndex === -1) return
      onChange(arrayMove(groups, activeIndex, overIndex))
      return
    }

    if (activeIdString.startsWith('scope-')) {
      const activeScopeId = Number(activeIdString.replace('scope-', ''))

      const sourceGroupIndex = groups.findIndex(group =>
        group.scopeIds.includes(activeScopeId),
      )
      if (sourceGroupIndex === -1) return

      let destinationGroupIndex: number
      let insertBeforeScopeId: number | null = null

      if (overIdString.startsWith('group-')) {
        destinationGroupIndex = groups.findIndex(
          group => `group-${group.id}` === overIdString,
        )
      } else if (overIdString.startsWith('scope-')) {
        const overScopeId = Number(overIdString.replace('scope-', ''))
        destinationGroupIndex = groups.findIndex(group =>
          group.scopeIds.includes(overScopeId),
        )
        insertBeforeScopeId = overScopeId
      } else {
        return
      }

      if (destinationGroupIndex === -1) return

      const updatedGroups = groups.map((group, groupIndex) => {
        if (
          groupIndex === sourceGroupIndex &&
          groupIndex === destinationGroupIndex
        ) {
          if (insertBeforeScopeId === null) return group
          const withoutActive = group.scopeIds.filter(
            id => id !== activeScopeId,
          )
          const insertIndex = withoutActive.indexOf(insertBeforeScopeId)
          if (insertIndex !== -1) {
            withoutActive.splice(insertIndex, 0, activeScopeId)
          } else {
            withoutActive.push(activeScopeId)
          }
          return { ...group, scopeIds: withoutActive }
        }
        if (groupIndex === sourceGroupIndex) {
          return {
            ...group,
            scopeIds: group.scopeIds.filter(id => id !== activeScopeId),
          }
        }
        if (groupIndex === destinationGroupIndex) {
          const newIds = group.scopeIds.filter(id => id !== activeScopeId)
          if (insertBeforeScopeId !== null) {
            const insertIndex = newIds.indexOf(insertBeforeScopeId)
            if (insertIndex !== -1) {
              newIds.splice(insertIndex, 0, activeScopeId)
            } else {
              newIds.push(activeScopeId)
            }
          } else {
            newIds.push(activeScopeId)
          }
          return { ...group, scopeIds: newIds }
        }
        return group
      })

      onChange(updatedGroups)
    }
  }

  function handleGroupNameChange(groupIndex: number, name: string) {
    onChange(
      groups.map((group, index) =>
        index === groupIndex ? { ...group, name } : group,
      ),
    )
  }

  function handleAddGroup() {
    const newGroup: AreaOrderGroup = {
      id: crypto.randomUUID(),
      name: `${groups.length + 1}° FORNECIMENTO`,
      scopeIds: [],
    }
    onChange([...groups, newGroup])
  }

  function handleDeleteGroup(groupIndex: number) {
    if (groups.length <= 1) return
    const groupToDelete = groups[groupIndex]
    const adjacentIndex = groupIndex > 0 ? groupIndex - 1 : groupIndex + 1
    const updatedGroups = groups
      .map((group, index) => {
        if (index === adjacentIndex) {
          return {
            ...group,
            scopeIds: [...group.scopeIds, ...groupToDelete.scopeIds],
          }
        }
        return group
      })
      .filter((_, index) => index !== groupIndex)
    onChange(updatedGroups)
  }

  const groupSortableIds = groups.map(group => `group-${group.id}`)

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={groupSortableIds}
          strategy={verticalListSortingStrategy}
        >
          {groups.map((group, groupIndex) => (
            <SortableGroupCard
              key={group.id}
              group={group}
              isEditing={isEditing}
              canDelete={groups.length > 1}
              onNameChange={name => handleGroupNameChange(groupIndex, name)}
              onDelete={() => handleDeleteGroup(groupIndex)}
            >
              <SortableContext
                items={group.scopeIds.map(scopeId => `scope-${scopeId}`)}
                strategy={verticalListSortingStrategy}
              >
                {group.scopeIds.map(scopeId => (
                  <SortableScopeChip
                    key={scopeId}
                    scopeId={scopeId}
                    scopeMap={scopeMap}
                    isEditing={isEditing}
                  />
                ))}
              </SortableContext>
            </SortableGroupCard>
          ))}
        </SortableContext>
      </DndContext>
      {isEditing && (
        <button
          type="button"
          onClick={handleAddGroup}
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
          ＋ Adicionar Grupo
        </button>
      )}
    </div>
  )
}
