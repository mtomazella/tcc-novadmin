import React, { useEffect, useRef, useState } from 'react'
import {
  parseLocalizedNumber,
  toLocalDecimal,
} from '@novadmin/lib/utils/unitConversion'
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { FiTrash2 } from 'react-icons/fi'

const TABLE_DARK_COLOR = '#2d2d2d'

export type QuoteValuesTableMode = 'read' | 'edit'
export type QuoteValuesTableRowType = 'body' | 'subheader' | 'footer'

export type QuoteValuesTableColumn<T extends Record<string, any>> = {
  key: string
  label: string
  field: keyof T & string
  align?: 'left' | 'center' | 'right'
  width?: number | string
  editable?: boolean
  inputType?: 'text' | 'number'
  prefix?: string | ((row: T) => string | undefined)
  suffix?: string | ((row: T) => string | undefined)
  placeholder?: string | ((row: T) => string | undefined)
  precision?: number
  formatter?: (value: any, row: T) => React.ReactNode
}

interface QuoteValuesTableProps<T extends Record<string, any>> {
  columns: QuoteValuesTableColumn<T>[]
  rows: T[]
  mode?: QuoteValuesTableMode
  rowIdField?: keyof T & string
  emptyText?: string
  getRowType?: (row: T) => QuoteValuesTableRowType
  getRowClassName?: (row: T) => string
  onRowChange?: (
    rowId: string | number,
    field: keyof T & string,
    value: any,
  ) => void
  onRowDelete?: (rowId: string | number) => void
  canDeleteRow?: (row: T) => boolean
}

type EditableCellProps = {
  value: any
  inputMode: 'decimal' | 'text'
  placeholder?: string
  prefix?: string
  suffix?: string
  isNumber: boolean
  precision?: number
  onChange: (value: any) => void
}

function EditableCell({
  value,
  inputMode,
  placeholder,
  prefix,
  suffix,
  isNumber,
  precision,
  onChange,
}: EditableCellProps) {
  const toLocalFormatted = (v: any): string => {
    if (v == null || v === '') return ''
    return isNumber ? toLocalDecimal(Number(v), precision) : String(v)
  }

  const [localValue, setLocalValue] = useState<string>(toLocalFormatted(value))
  const commitRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusedRef = useRef(false)

  // Sync from parent only when not focused (avoids overwriting mid-typing)
  useEffect(() => {
    if (!isFocusedRef.current) {
      if (value == null || value === '') {
        setLocalValue('')
      } else {
        setLocalValue(
          isNumber ? toLocalDecimal(Number(value), precision) : String(value),
        )
      }
    }
  }, [value, isNumber, precision])

  useEffect(() => {
    return () => {
      if (commitRef.current) clearTimeout(commitRef.current)
    }
  }, [])

  const scheduleCommit = (raw: string) => {
    if (commitRef.current) clearTimeout(commitRef.current)
    commitRef.current = setTimeout(() => {
      const next = isNumber
        ? raw === ''
          ? ''
          : parseLocalizedNumber(raw)
        : raw
      onChange(next)
    }, 180)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    scheduleCommit(raw)
  }

  const handleBlur = () => {
    isFocusedRef.current = false
    // Apply precision formatting once the user leaves the field
    if (isNumber && localValue !== '') {
      setLocalValue(toLocalFormatted(parseLocalizedNumber(localValue)))
    }
  }

  return (
    <span className="flex items-center gap-1">
      {prefix && (
        <span className="shrink-0 text-sm text-gray-500">{prefix}</span>
      )}
      <input
        type="text"
        inputMode={inputMode}
        value={localValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => {
          isFocusedRef.current = true
        }}
        onBlur={handleBlur}
        className="w-full bg-transparent border-0 border-b border-gray-300 focus:border-violet-500 focus:outline-none text-sm"
      />
      {suffix && (
        <span className="shrink-0 text-sm text-gray-500">{suffix}</span>
      )}
    </span>
  )
}

export default function QuoteValuesTable<T extends Record<string, any>>({
  columns,
  rows,
  mode = 'read',
  rowIdField = 'id' as keyof T & string,
  emptyText = 'Nenhum valor encontrado',
  getRowType,
  getRowClassName,
  onRowChange,
  onRowDelete,
  canDeleteRow,
}: QuoteValuesTableProps<T>) {
  const showActions = mode === 'edit' && Boolean(onRowDelete)
  const totalColSpan = columns.length + (showActions ? 1 : 0)

  const renderCell = (row: T, column: QuoteValuesTableColumn<T>) => {
    const value = row[column.field]

    if (column.formatter && (mode === 'read' || !column.editable)) {
      const formatted = column.formatter(value, row)
      if (formatted !== null && formatted !== undefined) {
        if (value === null || value === undefined || value === '') {
          return <span className="text-gray-400">{formatted}</span>
        }
        return formatted
      }
    }

    if (mode === 'edit' && column.editable && onRowChange) {
      const prefix =
        typeof column.prefix === 'function' ? column.prefix(row) : column.prefix
      const suffix =
        typeof column.suffix === 'function' ? column.suffix(row) : column.suffix
      const placeholder =
        typeof column.placeholder === 'function'
          ? column.placeholder(row)
          : column.placeholder

      return (
        <EditableCell
          value={value}
          inputMode={column.inputType === 'number' ? 'decimal' : 'text'}
          placeholder={placeholder}
          prefix={prefix}
          suffix={suffix}
          isNumber={column.inputType === 'number'}
          precision={column.precision}
          onChange={next => onRowChange(row[rowIdField], column.field, next)}
        />
      )
    }

    if (value === null || value === undefined || value === '') {
      const placeholder =
        typeof column.placeholder === 'function'
          ? column.placeholder(row)
          : column.placeholder
      if (placeholder) {
        const suffix =
          typeof column.suffix === 'function'
            ? column.suffix(row)
            : column.suffix
        return (
          <span className="text-gray-400">
            {placeholder}
            {suffix ? (suffix !== '%' ? ` ${suffix}` : suffix) : ''}
          </span>
        )
      }
      return '-'
    }

    const suffix =
      typeof column.suffix === 'function' ? column.suffix(row) : column.suffix
    return suffix
      ? `${String(value)}${suffix !== '%' ? ' ' : ''}${suffix}`
      : String(value)
  }

  const renderRow = (row: T) => {
    const rowId = row[rowIdField] as string | number
    const rowType = getRowType?.(row) ?? 'body'

    if (rowType === 'subheader') {
      return (
        <TableRow key={String(rowId)}>
          <TableCell
            colSpan={totalColSpan}
            sx={{
              backgroundColor: TABLE_DARK_COLOR,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              py: '6px',
            }}
          >
            {String(row[columns[0].field] ?? '')}
          </TableCell>
        </TableRow>
      )
    }

    if (rowType === 'footer') {
      return (
        <TableRow key={String(rowId)}>
          {columns.map(column => (
            <TableCell
              key={`${String(rowId)}-${column.key}`}
              align={column.align ?? 'left'}
              sx={{
                width: column.width,
                backgroundColor: TABLE_DARK_COLOR,
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              {column.formatter
                ? column.formatter(row[column.field], row)
                : String(row[column.field] ?? '-')}
            </TableCell>
          ))}
          {showActions && (
            <TableCell
              sx={{ backgroundColor: TABLE_DARK_COLOR, color: '#ffffff' }}
            >
              -
            </TableCell>
          )}
        </TableRow>
      )
    }

    return (
      <TableRow
        key={String(rowId)}
        className={getRowClassName?.(row)}
        hover={mode === 'read'}
      >
        {columns.map(column => (
          <TableCell
            key={`${String(rowId)}-${column.key}`}
            align={column.align ?? 'left'}
            sx={{ width: column.width }}
          >
            {renderCell(row, column)}
          </TableCell>
        ))}
        {showActions && (
          <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
            {(!canDeleteRow || canDeleteRow(row)) && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onRowDelete?.(rowId)}
              >
                <FiTrash2 size={14} />
              </IconButton>
            )}
          </TableCell>
        )}
      </TableRow>
    )
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column.key}
                align={column.align ?? 'left'}
                sx={{
                  width: column.width,
                  backgroundColor: TABLE_DARK_COLOR,
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                {column.label}
              </TableCell>
            ))}
            {showActions && (
              <TableCell
                align="center"
                sx={{
                  whiteSpace: 'nowrap',
                  width: '1%',
                  backgroundColor: TABLE_DARK_COLOR,
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                Ações
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={totalColSpan}
                className="py-6 text-center text-sm text-gray-500"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => renderRow(row))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
