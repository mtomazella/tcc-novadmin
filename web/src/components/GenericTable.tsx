import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  Paper,
  CircularProgress,
  IconButton,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Typography,
  alpha,
} from '@mui/material'
import {
  FiMoreVertical,
  FiPlus,
  FiChevronDown,
  FiChevronRight,
  FiGitBranch,
  FiFilePlus,
} from 'react-icons/fi'
import { FaEye, FaPencilAlt, FaPrint, FaTrash } from 'react-icons/fa'

interface Column {
  id: string
  label: string
  field: string
  truncate?: boolean
  hideOnMobile?: boolean
  formatter?: (value: any, item: any) => React.ReactNode
}

interface GenericTableProps {
  columns: Column[]
  data?: any[]
  isLoading?: boolean
  onAddClick?: () => void
  addButtonText?: string
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  onPrintDocument?: (item: any) => void
  onViewModal?: (item: any) => void
  onPrintTags?: (item: any) => void
  onCreateRevision?: (item: any) => void
  onCreateAddition?: (item: any) => void
  onRowDoubleClick?: (item: any) => void
  title?: string
  fetchData?: (params: { page: number; limit: number }) => Promise<{
    count: any
    data: any[]
    meta: {
      page?: number
      limit?: number
    }
  }>
  expandable?: boolean
  getRowChildren?: (row: any) => any[] | undefined
  parentIdField?: string
  rowIdField?: string
}

export interface GenericTableRef {
  refresh: () => void
}

const GenericTable = forwardRef<GenericTableRef, GenericTableProps>(
  (props, ref) => {
    const {
      columns,
      data: propData = [],
      isLoading: propIsLoading = false,
      onAddClick,
      addButtonText = 'Adicionar',
      onEdit,
      onDelete,
      onPrintDocument,
      onViewModal,
      onPrintTags,
      onCreateRevision,
      onCreateAddition,
      onRowDoubleClick,
      title,
      fetchData,
      expandable = false,
      getRowChildren,
      parentIdField = 'fatherId',
      rowIdField = 'id',
    } = props

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const primaryColor = 'rgb(124, 58, 237)'
    const primaryLight = alpha(primaryColor, 0.1)
    const primaryLighter = alpha(primaryColor, 0.05)

    const [internalData, setInternalData] = useState<any[]>([])
    const [internalLoading, setInternalLoading] = useState(true)
    const [totalItems, setTotalItems] = useState(0)
    const [pagination, setPagination] = useState({
      page: 0,
      limit: 10,
      totalItems: 0,
    })

    const [refreshKey, setRefreshKey] = useState(0)
    const [expandedRows, setExpandedRows] = useState<Set<any>>(new Set())

    const [menuPosition, setMenuPosition] = useState<{
      top: number
      left: number
    } | null>(null)
    const [selectedRow, setSelectedRow] = useState<any>(null)

    useImperativeHandle(ref, () => ({
      refresh: () => setRefreshKey(prev => prev + 1),
    }))

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
      event.preventDefault()
      event.stopPropagation()
      setSelectedRow(row)

      setMenuPosition({
        top: event.clientY + 8,
        left: event.clientX - 40,
      })
    }

    const handleMenuClose = () => {
      setMenuPosition(null)
      setSelectedRow(null)
    }

    const handleEditClick = () => {
      onEdit?.(selectedRow)
      handleMenuClose()
    }
    const handleViewModalClick = () => {
      onViewModal?.(selectedRow)
      handleMenuClose()
    }
    const handlePrintTagsClick = () => {
      onPrintTags?.(selectedRow)
      handleMenuClose()
    }
    const handlePrintDocumentClick = () => {
      onPrintDocument?.(selectedRow)
      handleMenuClose()
    }
    const handleDeleteClick = () => {
      onDelete?.(selectedRow)
      handleMenuClose()
    }
    const handleCreateRevisionClick = () => {
      onCreateRevision?.(selectedRow)
      handleMenuClose()
    }
    const handleCreateAdditionClick = () => {
      onCreateAddition?.(selectedRow)
      handleMenuClose()
    }

    const toggleRowExpansion = (rowId: any) => {
      const newSet = new Set(expandedRows)
      newSet.has(rowId) ? newSet.delete(rowId) : newSet.add(rowId)
      setExpandedRows(newSet)
    }

    const getNestedValue = (obj: any, path: string) => {
      if (!obj) return ''
      return path.split('.').reduce((acc, part) => acc && acc[part], obj) || ''
    }

    const buildHierarchyFromChildren = (items: any[], level: number): any[] => {
      return items.map(item => ({
        ...item,
        level,
        children: buildHierarchyFromChildren(
          getRowChildren?.(item) ?? [],
          level + 1,
        ),
      }))
    }

    const buildHierarchy = (
      items: any[],
      parentId: any = null,
      level = 0,
    ): any[] => {
      if (getRowChildren) {
        return items.map(item => ({
          ...item,
          level,
          children: buildHierarchyFromChildren(
            getRowChildren(item) ?? [],
            level + 1,
          ),
        }))
      }

      return items
        .filter(item => item[parentIdField] === parentId)
        .map(item => ({
          ...item,
          level,
          children: buildHierarchy(items, item[rowIdField], level + 1),
        }))
    }

    const organizeHierarchy = (data: any[]) => {
      if (!expandable) return data.map(item => ({ ...item, level: 0 }))
      return buildHierarchy(data)
    }

    const renderHierarchyRows = (items: any[]): React.ReactNode[] => {
      return items.flatMap(item => {
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = expandedRows.has(item[rowIdField])
        const level = item.level || 0

        return [
          <TableRow
            key={item[rowIdField]}
            onClick={
              expandable && hasChildren
                ? () => toggleRowExpansion(item[rowIdField])
                : undefined
            }
            onDoubleClick={
              onRowDoubleClick ? () => onRowDoubleClick(item) : undefined
            }
            sx={theme => ({
              cursor:
                onRowDoubleClick || (expandable && hasChildren)
                  ? 'pointer'
                  : 'default',
              backgroundColor:
                level === 0
                  ? theme.palette.background.default
                  : level === 1
                  ? primaryLighter
                  : alpha(primaryColor, 0.02),
              borderLeft:
                level > 0
                  ? `4px solid ${alpha(primaryColor, level === 1 ? 0.6 : 0.3)}`
                  : 'none',
              '&:hover': {
                backgroundColor:
                  level === 0
                    ? theme.palette.action.hover
                    : alpha(primaryColor, level === 1 ? 0.08 : 0.04),
              },
              '& > td:first-of-type': {
                paddingLeft: expandable ? level * 4 + 2 : level * 4 + 16,
              },
            })}
          >
            {expandable && (
              <TableCell sx={{ width: 50, minWidth: 50 }}>
                {hasChildren ? (
                  <IconButton
                    onClick={event => {
                      event.stopPropagation()
                      toggleRowExpansion(item[rowIdField])
                    }}
                    size="small"
                    sx={theme => ({
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        backgroundColor: primaryLighter,
                      },
                    })}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        transform: isExpanded
                          ? 'rotate(90deg)'
                          : 'rotate(0deg)',
                      }}
                    >
                      <FiChevronRight
                        size={16}
                        style={{ color: primaryColor }}
                      />
                    </Box>
                  </IconButton>
                ) : (
                  <Box sx={{ width: 40, display: 'inline-block' }} />
                )}
              </TableCell>
            )}

            {visibleColumns.map(col => (
              <TableCell
                key={`${item[rowIdField]}-${col.id}`}
                sx={{
                  whiteSpace: 'nowrap',
                  fontWeight: level === 0 ? 600 : level === 1 ? 500 : 400,
                  color: theme =>
                    level === 0
                      ? theme.palette.text.primary
                      : level === 1
                      ? theme.palette.text.secondary
                      : theme.palette.text.disabled,
                  ...(!expandable && col.id === visibleColumns[0]?.id
                    ? {
                        paddingLeft: '16px !important',
                      }
                    : {}),
                }}
              >
                {level > 0 && col.id === visibleColumns[0]?.id && (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: level * 8,
                      mr: 1,
                    }}
                  />
                )}
                {col.formatter
                  ? col.formatter(getNestedValue(item, col.field), item)
                  : getNestedValue(item, col.field)}
              </TableCell>
            ))}

            {actionColumnCount > 0 && (
              <TableCell align="center" sx={{ minWidth: 80 }}>
                <IconButton
                  onClick={e => handleMenuOpen(e, item)}
                  size="small"
                  sx={theme => ({
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    color: primaryColor,
                    '&:hover': {
                      backgroundColor: primaryLighter,
                    },
                  })}
                >
                  <FiMoreVertical size={14} />
                </IconButton>
              </TableCell>
            )}
          </TableRow>,

          ...(hasChildren && isExpanded
            ? renderHierarchyRows(item.children)
            : []),
        ].filter(Boolean)
      })
    }

    useEffect(() => {
      if (!fetchData) return

      const load = async () => {
        try {
          setInternalLoading(true)
          const res = await fetchData({
            page: pagination.page + 1,
            limit: pagination.limit,
          })

          setTotalItems(Number(res.count?.total ?? res.data.length))
          setInternalData(expandable ? organizeHierarchy(res.data) : res.data)
        } finally {
          setInternalLoading(false)
        }
      }

      load()
    }, [fetchData, pagination.page, pagination.limit, refreshKey])

    const displayData = fetchData ? internalData : organizeHierarchy(propData)
    const displayLoading = fetchData ? internalLoading : propIsLoading

    const visibleColumns = columns.filter(col => !isMobile || !col.hideOnMobile)
    const actionColumnCount =
      onEdit ||
      onDelete ||
      onPrintDocument ||
      onViewModal ||
      onCreateRevision ||
      onCreateAddition
        ? 1
        : 0
    const totalColumns =
      visibleColumns.length + actionColumnCount + (expandable ? 1 : 0)

    const handlePageChange = (_: any, newPage: number) =>
      setPagination(prev => ({ ...prev, page: newPage }))

    const handleRowsPerPageChange = (e: any) =>
      setPagination({
        page: 0,
        limit: parseInt(e.target.value, 10),
        totalItems,
      })

    const from = pagination.page * pagination.limit + 1
    const to = from + displayData.length - 1

    return (
      <div>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          {title && (
            <Typography
              variant="h6"
              fontWeight={600}
              style={{ color: primaryColor }}
            >
              {title}
            </Typography>
          )}

          {onAddClick && (
            <Button
              variant="contained"
              onClick={onAddClick}
              startIcon={<FiPlus style={{ color: 'white' }} />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 2,
                backgroundColor: primaryColor,
                '&:hover': {
                  backgroundColor: alpha(primaryColor, 0.8),
                },
              }}
            >
              {addButtonText}
            </Button>
          )}
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            border: theme => `1px solid ${theme.palette.divider}`,
            boxShadow: 2,
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: primaryColor }}>
                {expandable && (
                  <TableCell sx={{ width: 50, minWidth: 50, color: 'white' }} />
                )}
                {visibleColumns.map(col => (
                  <TableCell
                    key={col.id}
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      ...(!expandable && col.id === visibleColumns[0]?.id
                        ? {
                            paddingLeft: '16px !important',
                          }
                        : {}),
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
                {actionColumnCount > 0 && (
                  <TableCell
                    align="center"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      minWidth: 80,
                    }}
                  >
                    Ações
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {displayLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <CircularProgress sx={{ color: primaryColor }} />
                    <Typography
                      variant="body2"
                      sx={{ mt: 2, color: 'text.secondary' }}
                    >
                      Carregando dados...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      Nenhum dado encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                renderHierarchyRows(displayData)
              )}
            </TableBody>

            {fetchData && (
              <TableFooter>
                <TableRow>
                  <TablePagination
                    count={totalItems}
                    rowsPerPage={pagination.limit}
                    page={pagination.page}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage="Itens por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} de ${
                        count !== -1 ? count : `mais de ${to}`
                      }`
                    }
                    sx={theme => ({
                      borderTop: `1px solid ${theme.palette.divider}`,
                      '& .MuiTablePagination-actions button': {
                        color: primaryColor,
                      },
                      '& .MuiTablePagination-selectIcon': {
                        color: primaryColor,
                      },
                    })}
                  />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>

        <Menu
          open={!!menuPosition}
          onClose={handleMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={menuPosition ?? undefined}
          PaperProps={{
            sx: theme => ({
              minWidth: 200,
              borderRadius: 2,
              boxShadow: 3,
              border: `1px solid ${theme.palette.divider}`,
            }),
          }}
        >
          {onEdit && (
            <MenuItem
              onClick={handleEditClick}
              sx={theme => ({
                py: 1.5,
                '&:hover': {
                  backgroundColor: primaryLighter,
                },
              })}
            >
              <FaPencilAlt
                size={14}
                className="mr-3"
                style={{ color: primaryColor }}
              />
              <Typography variant="body2">
                {expandable && selectedRow?.level > 0 ? 'Visualizar' : 'Editar'}
              </Typography>
            </MenuItem>
          )}
          {onViewModal && (
            <MenuItem
              onClick={handleViewModalClick}
              sx={theme => ({
                py: 1.5,
                '&:hover': {
                  backgroundColor: primaryLighter,
                },
              })}
            >
              <FaEye
                size={14}
                className="mr-3"
                style={{ color: primaryColor }}
              />
              <Typography variant="body2">Visualizar Detalhes</Typography>
            </MenuItem>
          )}
          {onPrintDocument && (
            <MenuItem
              onClick={handlePrintDocumentClick}
              sx={theme => ({
                py: 1.5,
                '&:hover': {
                  backgroundColor: primaryLighter,
                },
              })}
            >
              <FaPrint
                size={14}
                className="mr-3"
                style={{ color: primaryColor }}
              />
              <Typography variant="body2">Imprimir Documento</Typography>
            </MenuItem>
          )}
          {onPrintTags && (
            <MenuItem
              onClick={handlePrintTagsClick}
              sx={theme => ({
                py: 1.5,
                '&:hover': {
                  backgroundColor: primaryLighter,
                },
              })}
            >
              <FaPrint
                size={14}
                className="mr-3"
                style={{ color: primaryColor }}
              />
              <Typography variant="body2">Imprimir Etiquetas</Typography>
            </MenuItem>
          )}
          {onDelete && (!expandable || selectedRow?.level === 0) && (
            <MenuItem
              onClick={handleDeleteClick}
              sx={theme => ({
                py: 1.5,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                },
              })}
            >
              <FaTrash size={14} className="mr-3" />
              <Typography variant="body2">Excluir</Typography>
            </MenuItem>
          )}

          {onCreateRevision && (!expandable || selectedRow?.level === 0) && (
            <MenuItem
              onClick={handleCreateRevisionClick}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: primaryLighter,
                },
              }}
            >
              <FiGitBranch
                size={14}
                className="mr-3"
                style={{ color: primaryColor }}
              />
              <Typography variant="body2">Nova revisão</Typography>
            </MenuItem>
          )}

          {onCreateAddition && (!expandable || selectedRow?.level === 0) && (
            <MenuItem
              onClick={handleCreateAdditionClick}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: primaryLighter,
                },
              }}
            >
              <FiFilePlus
                size={14}
                className="mr-3"
                style={{ color: primaryColor }}
              />
              <Typography variant="body2">Nova adição</Typography>
            </MenuItem>
          )}
        </Menu>
      </div>
    )
  },
)

export default GenericTable
