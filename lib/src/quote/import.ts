import type {
    QuoteElementLajeValues,
    QuoteElementPilarValues,
    QuoteElementVigaValues,
} from 'types/quote.js'
import { parseLocalizedNumber } from 'utils/unitConversion.js'
import { appendElementDerivedValues } from './elements.js'

export type ImportCellValue = string | number | boolean | null
export type ImportElementType = 'pilar' | 'viga' | 'laje'
export type ImportFileFormat = 'legacy' | 'r01'

export type ImportElementRow = {
    scopeName: string
    name: string
    type: ImportElementType
    values:
        | QuoteElementPilarValues
        | QuoteElementVigaValues
        | QuoteElementLajeValues
}

const getCellString = (row: ImportCellValue[], columnIndex: number): string => {
    if (columnIndex < 0) return ''
    const value = row[columnIndex]
    if (value === null || value === undefined) return ''
    return String(value).trim()
}

const toNumber = (value: ImportCellValue): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') return parseLocalizedNumber(value)
    return 0
}

const toVigaTipo = (value: string): 'interno' | 'borda' =>
    value.toUpperCase().includes('BORDA') ? 'borda' : 'interno'

export const normalizeScopeName = (value: string): string =>
    value.trim().toLowerCase()

const findColumn = (headerRow: ImportCellValue[], pattern: RegExp): number => {
    for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex++) {
        const cell = headerRow[columnIndex]
        if (typeof cell === 'string' && pattern.test(cell.trim())) {
            return columnIndex
        }
    }
    return -1
}

// Minimal, accent/case-insensitive keyword sets identifying each (format, family)
// header row. Only columns the parser actually reads are listed — auxiliary
// tracking columns ("FORNECIMENTO INICIAL...", "Comentários", etc.) are ignored.
const HEADER_SIGNATURES: Record<
    ImportFileFormat,
    Record<ImportElementType, string[]>
> = {
    legacy: {
        pilar: ['trecho', 'pilares', 'fundo', 'lateral', 'pe dir', 'nivel'],
        viga: [
            'trecho',
            'vigas',
            'nivel',
            'largura',
            'altura',
            'comp',
            'laje a',
            'laje b',
            'tipo',
        ],
        laje: ['trecho', 'lajes', 'nivel', 'perimetro', 'area'],
    },
    r01: {
        pilar: ['torre', 'nomenclatura', 'fundo', 'lateral', 'pe dir', 'nivel'],
        viga: [
            'torre',
            'nomenclatura',
            'pavimento',
            'largura',
            'altura',
            'comp',
            'laje a',
            'laje b',
        ],
        laje: ['torre', 'nomenclatura', 'nivel', 'area'],
    },
}

const normalizeHeaderText = (value: ImportCellValue): string => {
    if (typeof value !== 'string') return ''
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
}

const rowMatchesSignature = (
    row: ImportCellValue[],
    signature: string[]
): boolean =>
    signature.every((keyword) =>
        row.some((cell) => normalizeHeaderText(cell).includes(keyword))
    )

type HeaderRowMatch = {
    format: ImportFileFormat
    family: ImportElementType
    headerRowIndex: number
}

const findHeaderRowMatch = (
    grid: ImportCellValue[][]
): HeaderRowMatch | null => {
    const formats = Object.keys(HEADER_SIGNATURES) as ImportFileFormat[]

    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const row = grid[rowIndex]
        if (!row) continue

        for (const format of formats) {
            const familiesByType = HEADER_SIGNATURES[format]
            const families = Object.keys(familiesByType) as ImportElementType[]

            for (const family of families) {
                if (rowMatchesSignature(row, familiesByType[family])) {
                    return { format, family, headerRowIndex: rowIndex }
                }
            }
        }
    }
    return null
}

export const detectImportFormat = (
    grid: ImportCellValue[][]
): ImportFileFormat | null => findHeaderRowMatch(grid)?.format ?? null

export const detectImportFamily = (
    grid: ImportCellValue[][]
): ImportElementType | null => findHeaderRowMatch(grid)?.family ?? null

const parsePilarRowsLegacy = (
    grid: ImportCellValue[][],
    headerRowIndex: number
): ImportElementRow[] => {
    const headerRow = grid[headerRowIndex]
    const columns = {
        name: findColumn(headerRow, /^pilares$/i),
        fundoCm: findColumn(headerRow, /^fundo\b/i),
        lateralCm: findColumn(headerRow, /^lateral\b/i),
        peDireitoM: findColumn(headerRow, /p[eé]\.?\s*dir/i),
        nivel: findColumn(headerRow, /^n[íi]vel$/i),
    }

    const rows: ImportElementRow[] = []
    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < grid.length;
        rowIndex++
    ) {
        const row = grid[rowIndex]
        if (!row) continue

        const name = getCellString(row, columns.name)
        const scopeName = getCellString(row, columns.nivel)
        if (!name || !scopeName) continue

        rows.push({
            scopeName,
            name,
            type: 'pilar',
            values: {
                fundoCm: toNumber(row[columns.fundoCm]),
                lateralCm: toNumber(row[columns.lateralCm]),
                peDireitoM: toNumber(row[columns.peDireitoM]),
                quantidade: 1,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
    }
    return rows
}

const parseVigaRowsLegacy = (
    grid: ImportCellValue[][],
    headerRowIndex: number
): ImportElementRow[] => {
    const headerRow = grid[headerRowIndex]
    const columns = {
        name: findColumn(headerRow, /^vigas$/i),
        largura: findColumn(headerRow, /^largura\b/i),
        altura: findColumn(headerRow, /^altura\b/i),
        comprimento: findColumn(headerRow, /^comp\b/i),
        lajeA: findColumn(headerRow, /laje\s*a/i),
        lajeB: findColumn(headerRow, /laje\s*b/i),
        tipo: findColumn(headerRow, /tipo\s*de\s*viga/i),
        nivel: findColumn(headerRow, /^n[íi]vel$/i),
    }

    const rows: ImportElementRow[] = []
    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < grid.length;
        rowIndex++
    ) {
        const row = grid[rowIndex]
        if (!row) continue

        const name = getCellString(row, columns.name)
        const scopeName = getCellString(row, columns.nivel)
        if (!name || !scopeName) continue

        rows.push({
            scopeName,
            name,
            type: 'viga',
            values: {
                fundoCm: toNumber(row[columns.altura]),
                lateralCm: toNumber(row[columns.largura]),
                comprimentoCm: toNumber(row[columns.comprimento]),
                alturaLajeLateralACm: toNumber(row[columns.lajeA]),
                alturaLajeLateralBCm: toNumber(row[columns.lajeB]),
                quantidade: 1,
                tipo: toVigaTipo(getCellString(row, columns.tipo)),
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
    }
    return rows
}

const parseLajeRowsLegacy = (
    grid: ImportCellValue[][],
    headerRowIndex: number
): ImportElementRow[] => {
    const headerRow = grid[headerRowIndex]
    const columns = {
        name: findColumn(headerRow, /^lajes$/i),
        perimetro: findColumn(headerRow, /per[íi]metro/i),
        area: findColumn(headerRow, /[áa]rea/i),
        nivel: findColumn(headerRow, /^n[íi]vel$/i),
    }

    const rows: ImportElementRow[] = []
    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < grid.length;
        rowIndex++
    ) {
        const row = grid[rowIndex]
        if (!row) continue

        const name = getCellString(row, columns.name)
        const scopeName = getCellString(row, columns.nivel)
        if (!name || !scopeName) continue

        rows.push({
            scopeName,
            name,
            type: 'laje',
            values: {
                areaM2: toNumber(row[columns.area]),
                perimetroM: toNumber(row[columns.perimetro]),
                fechamentoM2: 0,
                faixasAdicionaisM2: 0,
                quantidade: 1,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
    }
    return rows
}

const parsePilarRowsR01 = (
    grid: ImportCellValue[][],
    headerRowIndex: number
): ImportElementRow[] => {
    const headerRow = grid[headerRowIndex]
    const columns = {
        name: findColumn(headerRow, /nomenclatura/i),
        fundoCm: findColumn(headerRow, /^fundo\b/i),
        lateralCm: findColumn(headerRow, /^lateral\b/i),
        peDireitoM: findColumn(headerRow, /p[eé]\.?\s*dir/i),
        nivel: findColumn(headerRow, /^n[íi]vel/i),
    }

    const rows: ImportElementRow[] = []
    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < grid.length;
        rowIndex++
    ) {
        const row = grid[rowIndex]
        if (!row) continue

        const name = getCellString(row, columns.name)
        const scopeName = getCellString(row, columns.nivel)
        if (!name || !scopeName) continue

        rows.push({
            scopeName,
            name,
            type: 'pilar',
            values: {
                fundoCm: toNumber(row[columns.fundoCm]),
                lateralCm: toNumber(row[columns.lateralCm]),
                peDireitoM: toNumber(row[columns.peDireitoM]),
                quantidade: 1,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
    }
    return rows
}

const parseVigaRowsR01 = (
    grid: ImportCellValue[][],
    headerRowIndex: number
): ImportElementRow[] => {
    const headerRow = grid[headerRowIndex]
    const columns = {
        name: findColumn(headerRow, /nomenclatura/i),
        largura: findColumn(headerRow, /^largura\b/i),
        altura: findColumn(headerRow, /^altura\b/i),
        comprimento: findColumn(headerRow, /^comp\b/i),
        lajeA: findColumn(headerRow, /laje\s*a/i),
        lajeB: findColumn(headerRow, /laje\s*b/i),
        nivel: findColumn(headerRow, /^pavimento$/i),
    }

    const rows: ImportElementRow[] = []
    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < grid.length;
        rowIndex++
    ) {
        const row = grid[rowIndex]
        if (!row) continue

        const name = getCellString(row, columns.name)
        const scopeName = getCellString(row, columns.nivel)
        if (!name || !scopeName) continue

        rows.push({
            scopeName,
            name,
            type: 'viga',
            values: {
                fundoCm: toNumber(row[columns.altura]),
                lateralCm: toNumber(row[columns.largura]),
                comprimentoCm: toNumber(row[columns.comprimento]),
                alturaLajeLateralACm: toNumber(row[columns.lajeA]),
                alturaLajeLateralBCm: toNumber(row[columns.lajeB]),
                quantidade: 1,
                // The R01 export has no tipo column at all.
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
    }
    return rows
}

const parseLajeRowsR01 = (
    grid: ImportCellValue[][],
    headerRowIndex: number
): ImportElementRow[] => {
    const headerRow = grid[headerRowIndex]
    const columns = {
        name: findColumn(headerRow, /nomenclatura/i),
        area: findColumn(headerRow, /[áa]rea/i),
        nivel: findColumn(headerRow, /^n[íi]vel/i),
    }

    const rows: ImportElementRow[] = []
    for (
        let rowIndex = headerRowIndex + 1;
        rowIndex < grid.length;
        rowIndex++
    ) {
        const row = grid[rowIndex]
        if (!row) continue

        const name = getCellString(row, columns.name)
        const scopeName = getCellString(row, columns.nivel)
        if (!name || !scopeName) continue

        rows.push({
            scopeName,
            name,
            type: 'laje',
            values: {
                areaM2: toNumber(row[columns.area]),
                // The R01 export has no perimetro column at all.
                perimetroM: 0,
                fechamentoM2: 0,
                faixasAdicionaisM2: 0,
                quantidade: 1,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
    }
    return rows
}

export const parseImportGrid = (
    grid: ImportCellValue[][]
): ImportElementRow[] => {
    const match = findHeaderRowMatch(grid)
    if (!match) return []

    const { format, family, headerRowIndex } = match

    if (format === 'legacy') {
        switch (family) {
            case 'pilar':
                return parsePilarRowsLegacy(grid, headerRowIndex)
            case 'viga':
                return parseVigaRowsLegacy(grid, headerRowIndex)
            case 'laje':
                return parseLajeRowsLegacy(grid, headerRowIndex)
        }
    }

    if (format === 'r01') {
        switch (family) {
            case 'pilar':
                return parsePilarRowsR01(grid, headerRowIndex)
            case 'viga':
                return parseVigaRowsR01(grid, headerRowIndex)
            case 'laje':
                return parseLajeRowsR01(grid, headerRowIndex)
        }
    }

    return []
}

export type ImportScopeGroup = {
    scopeName: string
    pilares: ImportElementRow[]
    vigas: ImportElementRow[]
    lajes: ImportElementRow[]
}

export const groupImportRowsByScope = (
    rows: ImportElementRow[]
): ImportScopeGroup[] => {
    const groupsByScopeName = new Map<string, ImportScopeGroup>()

    for (const row of rows) {
        let group = groupsByScopeName.get(row.scopeName)
        if (!group) {
            group = {
                scopeName: row.scopeName,
                pilares: [],
                vigas: [],
                lajes: [],
            }
            groupsByScopeName.set(row.scopeName, group)
        }

        if (row.type === 'pilar') group.pilares.push(row)
        if (row.type === 'viga') group.vigas.push(row)
        if (row.type === 'laje') group.lajes.push(row)
    }

    return Array.from(groupsByScopeName.values())
}

export type ImportGroupSelection = {
    scopeName: string
    targetScopeName: string
    createScope: boolean
    includePilares: boolean
    includeVigas: boolean
    includeLajes: boolean
}

export type ImportRequestScope = {
    temporaryId: string
    name: string
    existingScopeId?: number
}

export type ImportRequestElement = {
    scopeTemporaryId?: string
    productId: number
    type: ImportElementType
    name: string
    values:
        | QuoteElementPilarValues
        | QuoteElementVigaValues
        | QuoteElementLajeValues
}

export type ImportRequestBody = {
    quoteId: number
    scopes: ImportRequestScope[]
    elements: ImportRequestElement[]
}

export const buildImportRequestBody = ({
    quoteId,
    groups,
    selections,
    productIdByType,
    existingScopesByNormalizedName = new Map(),
}: {
    quoteId: number
    groups: ImportScopeGroup[]
    selections: ImportGroupSelection[]
    productIdByType: Record<ImportElementType, number>
    existingScopesByNormalizedName?: Map<string, number>
}): ImportRequestBody => {
    const scopes: ImportRequestScope[] = []
    const elements: ImportRequestElement[] = []
    const temporaryIdByNormalizedTargetName = new Map<string, string>()
    let nextScopeIndex = 0

    groups.forEach((group) => {
        const selection = selections.find(
            (s) => s.scopeName === group.scopeName
        )
        if (!selection) return

        let temporaryId: string | undefined
        if (selection.createScope) {
            const normalizedTargetName = normalizeScopeName(
                selection.targetScopeName
            )
            const claimedTemporaryId =
                temporaryIdByNormalizedTargetName.get(normalizedTargetName)

            if (claimedTemporaryId) {
                temporaryId = claimedTemporaryId
            } else {
                temporaryId = `import-scope-${nextScopeIndex}`
                nextScopeIndex += 1
                temporaryIdByNormalizedTargetName.set(
                    normalizedTargetName,
                    temporaryId
                )
                scopes.push({
                    temporaryId,
                    name: selection.targetScopeName.trim(),
                    existingScopeId:
                        existingScopesByNormalizedName.get(
                            normalizedTargetName
                        ),
                })
            }
        }

        const familyRows: Array<[boolean, ImportElementRow[]]> = [
            [selection.includePilares, group.pilares],
            [selection.includeVigas, group.vigas],
            [selection.includeLajes, group.lajes],
        ]

        familyRows.forEach(([included, rows]) => {
            if (!included) return

            rows.forEach((row) => {
                const productId = productIdByType[row.type]
                const derived = appendElementDerivedValues({
                    quoteId,
                    scopeId: null,
                    productId,
                    type: row.type,
                    name: row.name,
                    values: row.values,
                })

                elements.push({
                    scopeTemporaryId: temporaryId,
                    productId,
                    type: row.type,
                    name: row.name,
                    values: derived.values as ImportRequestElement['values'],
                })
            })
        })
    })

    return { quoteId, scopes, elements }
}
