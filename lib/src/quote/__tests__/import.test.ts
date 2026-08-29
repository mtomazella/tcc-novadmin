import { describe, expect, test } from 'vitest'
import {
    buildImportRequestBody,
    detectImportFamily,
    detectImportFormat,
    groupImportRowsByScope,
    normalizeScopeName,
    parseImportGrid,
} from '../import.js'
import type {
    ImportCellValue,
    ImportElementRow,
    ImportScopeGroup,
} from '../import.js'

const pilarGrid: ImportCellValue[][] = [
    ['Tabela de Pilares', null, null, null, null, null, null, null],
    [
        'TRECHO',
        'Pilares',
        'Fundo - cm',
        'Lateral - cm',
        'Pé Dir. - m',
        'Nível',
        'FORNECIMENTO INICIAL - PAVIMENTO',
        'FÔRMA REAPROVEITADA DO',
    ],
    [null, null, null, null, null, null, null, null],
    ['5° SUBSOLO', null, null, null, null, null, null, null],
    ['TRECHO A', 'PA.4', 25, 90, 3.82, '5° SUBSOLO', '5° SUBSOLO', 'PA.4'],
    ['TRECHO A', 'PA.8', 30, 120, 3.82, '5° SUBSOLO', '5° SUBSOLO', 'PA.8'],
    ['5° SUBSOLO: 2', null, null, null, null, null, null, null],
]

const vigaGrid: ImportCellValue[][] = [
    [
        'Tabela de Vigas',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
    ],
    [
        'TRECHO',
        'Vigas',
        'Nível',
        'Largura - cm',
        'Altura - cm',
        'Comp. - cm',
        'Laje A - cm',
        'Laje B - cm',
        'TIPO DE VIGA',
        'FORNECIMENTO INICIAL - PAVIMENTO',
        'FORNECIMENTO INICIAL - ELEMENTO',
    ],
    [null, null, null, null, null, null, null, null, null, null, null],
    ['5° SUBSOLO', null, null, null, null, null, null, null, null, null, null],
    [
        'TRECHO A',
        'VA.301a',
        '5° SUBSOLO',
        25,
        40,
        92.5,
        12,
        0,
        'VIGA DE BORDA',
        '5° SUBSOLO',
        'VA.301a',
    ],
    [
        'TRECHO A',
        'VA.302a',
        '5° SUBSOLO',
        25,
        40,
        122.5,
        12,
        12,
        'INTERNA',
        '5° SUBSOLO',
        'VA.302a',
    ],
    [
        '5° SUBSOLO: 2',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
    ],
]

const lajeGrid: ImportCellValue[][] = [
    ['Tabela de Lajes', null, null, null, null, null, null],
    [
        'TRECHO',
        'Lajes',
        'Nível',
        'Perímetro - m',
        'Área - m²',
        'FORNECIMENTO INICIAL - PAVIMENTO',
        'FORNECIMENTO INICIAL - ELEMENTO',
    ],
    [null, null, null, null, null, null, null],
    ['5° SUBSOLO', null, null, null, null, null, null],
    ['TRECHO A', 'LA301', '5° SUBSOLO', 19.5, 19, '5° SUBSOLO', 'LA301'],
    ['5° SUBSOLO: 1', null, null, null, 19, null, null],
]

const pilarGridR01: ImportCellValue[][] = [
    ['Tabela de Pilares', null, null, null, null, null, null, null],
    [
        '1. TORRE',
        '0. NOMENCLATURA',
        'Fundo - cm',
        'Lateral - cm',
        'Pé Dir. - m',
        'Nível superior',
        'PAVIMENTO INICIAL',
        'ELEMENTO INICIAL',
    ],
    [null, null, null, null, null, null, null, null],
    ['FUNDAÇÃO', null, null, null, null, null, null, null],
    ['TORRE 1', 'BL1', '60,00', '60,00', '0,80', 'FUNDAÇÃO', '', ''],
    ['TORRE 1', 'BL2', '80,00', '80,00', '0,80', 'FUNDAÇÃO', '', ''],
]

const vigaGridR01: ImportCellValue[][] = [
    ['Tabela de Vigas', null, null, null, null, null, null, null],
    [
        '1. TORRE',
        '0. NOMENCLATURA',
        'PAVIMENTO',
        'Largura - cm',
        'Altura - cm',
        'Comp. - cm',
        'Laje A - cm',
        'Laje B - cm',
    ],
    ['TORRE 1', 'V102', '2° PAVIMENTO', '14', '32', '239', '0', '0'],
    ['TORRE 1', 'V101', '2° PAVIMENTO', '14', '32', '239', '0', '0'],
]

const lajeGridR01: ImportCellValue[][] = [
    ['Tabela de Lajes', null, null, null, null, null, null],
    [
        '1. TORRE',
        '0. NOMENCLATURA',
        'Nível',
        'Área - m²',
        'PAVIMENTO INICIAL',
        'ELEMENTO INICIAL',
        'Comentários',
    ],
    ['TORRE 1', 'L105', '2° PAVIMENTO', '8,86', '', '', ''],
    ['TORRE 1', 'L106', '2° PAVIMENTO', '10,64', '', '', ''],
]

describe('detectImportFormat', () => {
    test('detects legacy format from the TRECHO-style pilar header', () => {
        expect(detectImportFormat(pilarGrid)).toBe('legacy')
    })

    test('detects legacy format from the TRECHO-style viga header', () => {
        expect(detectImportFormat(vigaGrid)).toBe('legacy')
    })

    test('detects legacy format from the TRECHO-style laje header', () => {
        expect(detectImportFormat(lajeGrid)).toBe('legacy')
    })

    test('detects r01 format from the NOMENCLATURA-style pilar header', () => {
        expect(detectImportFormat(pilarGridR01)).toBe('r01')
    })

    test('detects r01 format from the NOMENCLATURA-style viga header', () => {
        expect(detectImportFormat(vigaGridR01)).toBe('r01')
    })

    test('detects r01 format from the NOMENCLATURA-style laje header', () => {
        expect(detectImportFormat(lajeGridR01)).toBe('r01')
    })

    test('returns null when no known header signature is found', () => {
        expect(detectImportFormat([['nothing', 'here']])).toBeNull()
    })
})

describe('detectImportFamily', () => {
    test('detects pilar from the header row', () => {
        expect(detectImportFamily(pilarGrid)).toBe('pilar')
    })

    test('detects viga from the header row', () => {
        expect(detectImportFamily(vigaGrid)).toBe('viga')
    })

    test('detects laje from the header row', () => {
        expect(detectImportFamily(lajeGrid)).toBe('laje')
    })

    test('returns null when no family header is found', () => {
        expect(detectImportFamily([['nothing', 'here']])).toBeNull()
    })

    test('detects pilar from the r01 header row', () => {
        expect(detectImportFamily(pilarGridR01)).toBe('pilar')
    })

    test('detects viga from the r01 header row', () => {
        expect(detectImportFamily(vigaGridR01)).toBe('viga')
    })

    test('detects laje from the r01 header row', () => {
        expect(detectImportFamily(lajeGridR01)).toBe('laje')
    })
})

describe('parseImportGrid — pilar', () => {
    test('extracts data rows, skipping header/summary/blank rows', () => {
        const rows = parseImportGrid(pilarGrid)

        expect(rows).toHaveLength(2)
        expect(rows[0]).toEqual({
            scopeName: '5° SUBSOLO',
            name: 'PA.4',
            type: 'pilar',
            values: {
                fundoCm: 25,
                lateralCm: 90,
                peDireitoM: 3.82,
                quantidade: 1,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
        expect(rows[1].name).toBe('PA.8')
    })
})

describe('parseImportGrid — pilar r01', () => {
    test('extracts data rows using the NOMENCLATURA/Nível superior headers', () => {
        const rows = parseImportGrid(pilarGridR01)

        expect(rows).toHaveLength(2)
        expect(rows[0]).toEqual({
            scopeName: 'FUNDAÇÃO',
            name: 'BL1',
            type: 'pilar',
            values: {
                fundoCm: 60,
                lateralCm: 60,
                peDireitoM: 0.8,
                quantidade: 1,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
        expect(rows[1].name).toBe('BL2')
    })
})

describe('parseImportGrid — viga', () => {
    test('extracts data rows and maps TIPO DE VIGA to tipo', () => {
        const rows = parseImportGrid(vigaGrid)

        expect(rows).toHaveLength(2)
        expect(rows[0]).toEqual({
            scopeName: '5° SUBSOLO',
            name: 'VA.301a',
            type: 'viga',
            values: {
                fundoCm: 40,
                lateralCm: 25,
                comprimentoCm: 92.5,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 0,
                quantidade: 1,
                tipo: 'borda',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
        expect((rows[1].values as { tipo: string }).tipo).toBe('interno')
    })
})

describe('parseImportGrid — viga r01', () => {
    test('extracts data rows using the NOMENCLATURA/PAVIMENTO headers, defaulting tipo to interno', () => {
        const rows = parseImportGrid(vigaGridR01)

        expect(rows).toHaveLength(2)
        expect(rows[0]).toEqual({
            scopeName: '2° PAVIMENTO',
            name: 'V102',
            type: 'viga',
            values: {
                fundoCm: 32,
                lateralCm: 14,
                comprimentoCm: 239,
                alturaLajeLateralACm: 0,
                alturaLajeLateralBCm: 0,
                quantidade: 1,
                tipo: 'interno',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
        expect(rows[1].name).toBe('V101')
    })
})

describe('parseImportGrid — laje', () => {
    test('extracts data rows with fechamentoM2/faixasAdicionaisM2 defaulted to 0', () => {
        const rows = parseImportGrid(lajeGrid)

        expect(rows).toHaveLength(1)
        expect(rows[0]).toEqual({
            scopeName: '5° SUBSOLO',
            name: 'LA301',
            type: 'laje',
            values: {
                areaM2: 19,
                perimetroM: 19.5,
                fechamentoM2: 0,
                faixasAdicionaisM2: 0,
                quantidade: 1,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
    })
})

describe('parseImportGrid — laje r01', () => {
    test('extracts data rows using the NOMENCLATURA header, defaulting perimetroM to 0', () => {
        const rows = parseImportGrid(lajeGridR01)

        expect(rows).toHaveLength(2)
        expect(rows[0]).toEqual({
            scopeName: '2° PAVIMENTO',
            name: 'L105',
            type: 'laje',
            values: {
                areaM2: 8.86,
                perimetroM: 0,
                fechamentoM2: 0,
                faixasAdicionaisM2: 0,
                quantidade: 1,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        })
        expect(rows[1].name).toBe('L106')
    })
})

describe('parseImportGrid — csv-style string cells', () => {
    test('parses comma-decimal numeric strings via parseLocalizedNumber', () => {
        const csvStyleGrid: ImportCellValue[][] = [
            [
                'TRECHO',
                'Pilares',
                'Fundo - cm',
                'Lateral - cm',
                'Pé Dir. - m',
                'Nível',
            ],
            ['TRECHO A', 'PA.1', '25', '90', '3,82', '5° SUBSOLO'],
        ]

        const rows = parseImportGrid(csvStyleGrid)

        expect(rows).toHaveLength(1)
        expect((rows[0].values as { peDireitoM: number }).peDireitoM).toBe(3.82)
    })
})

describe('parseImportGrid — edge cases', () => {
    test('returns an empty array when the family cannot be detected', () => {
        expect(parseImportGrid([['nothing', 'here']])).toEqual([])
    })

    test('skips a data row with a blank Nível column', () => {
        const gridWithBlankNivel: ImportCellValue[][] = [
            [
                'TRECHO',
                'Pilares',
                'Fundo - cm',
                'Lateral - cm',
                'Pé Dir. - m',
                'Nível',
            ],
            ['TRECHO A', 'PA.1', 25, 90, 3.82, null],
        ]

        expect(parseImportGrid(gridWithBlankNivel)).toEqual([])
    })
})

describe('groupImportRowsByScope', () => {
    test('merges rows from different families into one group by scope name', () => {
        const pilarRow: ImportElementRow = {
            scopeName: '5° SUBSOLO',
            name: 'PA.4',
            type: 'pilar',
            values: {
                fundoCm: 25,
                lateralCm: 90,
                peDireitoM: 3.82,
                quantidade: 1,
                cambotado: false,
                needsGastalho: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }
        const vigaRow: ImportElementRow = {
            scopeName: '5° SUBSOLO',
            name: 'VA.301a',
            type: 'viga',
            values: {
                fundoCm: 40,
                lateralCm: 25,
                comprimentoCm: 92.5,
                alturaLajeLateralACm: 12,
                alturaLajeLateralBCm: 0,
                quantidade: 1,
                tipo: 'borda',
                cambotado: false,
                needsGarfo: false,
                ripado: false,
                aparente: false,
                paginado: false,
            },
        }
        const otherScopePilarRow: ImportElementRow = {
            ...pilarRow,
            scopeName: '4° SUBSOLO',
            name: 'PA.9',
        }

        const groups = groupImportRowsByScope([
            pilarRow,
            vigaRow,
            otherScopePilarRow,
        ])

        expect(groups).toHaveLength(2)

        const subsolo5 = groups.find(
            (group) => group.scopeName === '5° SUBSOLO'
        )
        expect(subsolo5?.pilares).toEqual([pilarRow])
        expect(subsolo5?.vigas).toEqual([vigaRow])
        expect(subsolo5?.lajes).toEqual([])

        const subsolo4 = groups.find(
            (group) => group.scopeName === '4° SUBSOLO'
        )
        expect(subsolo4?.pilares).toEqual([otherScopePilarRow])
    })

    test('returns an empty array for no rows', () => {
        expect(groupImportRowsByScope([])).toEqual([])
    })
})

describe('normalizeScopeName', () => {
    test('trims whitespace and lowercases', () => {
        expect(normalizeScopeName('  5° Subsolo  ')).toBe('5° subsolo')
    })
})

describe('buildImportRequestBody', () => {
    const pilarRow: ImportElementRow = {
        scopeName: '5° SUBSOLO',
        name: 'PA.4',
        type: 'pilar',
        values: {
            fundoCm: 25,
            lateralCm: 90,
            peDireitoM: 3.82,
            quantidade: 1,
            cambotado: false,
            needsGastalho: false,
            ripado: false,
            aparente: false,
            paginado: false,
        },
    }
    const vigaRow: ImportElementRow = {
        scopeName: '5° SUBSOLO',
        name: 'VA.301a',
        type: 'viga',
        values: {
            fundoCm: 40,
            lateralCm: 25,
            comprimentoCm: 92.5,
            alturaLajeLateralACm: 12,
            alturaLajeLateralBCm: 0,
            quantidade: 1,
            tipo: 'borda',
            cambotado: false,
            needsGarfo: false,
            ripado: false,
            aparente: false,
            paginado: false,
        },
    }
    const group: ImportScopeGroup = {
        scopeName: '5° SUBSOLO',
        pilares: [pilarRow],
        vigas: [vigaRow],
        lajes: [],
    }
    const productIdByType = { pilar: 5, viga: 11, laje: 16 }

    test('creates a scope and links its elements via temporaryId when createScope is true', () => {
        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group],
            selections: [
                {
                    scopeName: '5° SUBSOLO',
                    targetScopeName: '5° SUBSOLO',
                    createScope: true,
                    includePilares: true,
                    includeVigas: true,
                    includeLajes: true,
                },
            ],
            productIdByType,
        })

        expect(body.quoteId).toBe(42)
        expect(body.scopes).toEqual([
            { temporaryId: 'import-scope-0', name: '5° SUBSOLO' },
        ])
        expect(body.elements).toHaveLength(2)
        expect(body.elements[0]).toMatchObject({
            scopeTemporaryId: 'import-scope-0',
            productId: 5,
            type: 'pilar',
            name: 'PA.4',
        })
        expect(
            (body.elements[0].values as { metragemM2?: number }).metragemM2
        ).toBeDefined()
        expect(body.elements[1]).toMatchObject({
            scopeTemporaryId: 'import-scope-0',
            productId: 11,
            type: 'viga',
            name: 'VA.301a',
        })
    })

    test('omits scopeTemporaryId and does not emit a scope when createScope is false', () => {
        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group],
            selections: [
                {
                    scopeName: '5° SUBSOLO',
                    targetScopeName: '5° SUBSOLO',
                    createScope: false,
                    includePilares: true,
                    includeVigas: true,
                    includeLajes: true,
                },
            ],
            productIdByType,
        })

        expect(body.scopes).toEqual([])
        expect(
            body.elements.every(
                (element) => element.scopeTemporaryId === undefined
            )
        ).toBe(true)
    })

    test('excludes a family entirely when its checkbox is unchecked', () => {
        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group],
            selections: [
                {
                    scopeName: '5° SUBSOLO',
                    targetScopeName: '5° SUBSOLO',
                    createScope: true,
                    includePilares: true,
                    includeVigas: false,
                    includeLajes: true,
                },
            ],
            productIdByType,
        })

        expect(body.elements).toHaveLength(1)
        expect(body.elements[0].type).toBe('pilar')
    })

    test('skips a group entirely when it has no matching selection', () => {
        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group],
            selections: [],
            productIdByType,
        })

        expect(body.scopes).toEqual([])
        expect(body.elements).toEqual([])
    })

    test('resolves to an existing scope when the target name matches (case-insensitive, trimmed)', () => {
        const existingScopesByNormalizedName = new Map([['5° subsolo', 42]])

        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group],
            selections: [
                {
                    scopeName: '5° SUBSOLO',
                    targetScopeName: '  5° Subsolo  ',
                    createScope: true,
                    includePilares: true,
                    includeVigas: true,
                    includeLajes: true,
                },
            ],
            productIdByType,
            existingScopesByNormalizedName,
        })

        expect(body.scopes).toEqual([
            {
                temporaryId: 'import-scope-0',
                name: '5° Subsolo',
                existingScopeId: 42,
            },
        ])
        expect(
            body.elements.every(
                (element) => element.scopeTemporaryId === 'import-scope-0'
            )
        ).toBe(true)
    })

    test('creates a new scope with the renamed name when the target name matches nothing existing', () => {
        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group],
            selections: [
                {
                    scopeName: '5° SUBSOLO',
                    targetScopeName: 'PAVIMENTO RENOMEADO',
                    createScope: true,
                    includePilares: true,
                    includeVigas: true,
                    includeLajes: true,
                },
            ],
            productIdByType,
            existingScopesByNormalizedName: new Map([['5° subsolo', 42]]),
        })

        expect(body.scopes).toEqual([
            { temporaryId: 'import-scope-0', name: 'PAVIMENTO RENOMEADO' },
        ])
    })

    test('dedupes two groups renamed to the same target name into one new scope', () => {
        const secondGroup: ImportScopeGroup = {
            scopeName: '4° SUBSOLO',
            pilares: [{ ...pilarRow, name: 'PA.9' }],
            vigas: [],
            lajes: [],
        }

        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group, secondGroup],
            selections: [
                {
                    scopeName: '5° SUBSOLO',
                    targetScopeName: 'PAVIMENTO ÚNICO',
                    createScope: true,
                    includePilares: true,
                    includeVigas: true,
                    includeLajes: true,
                },
                {
                    scopeName: '4° SUBSOLO',
                    targetScopeName: 'PAVIMENTO ÚNICO',
                    createScope: true,
                    includePilares: true,
                    includeVigas: false,
                    includeLajes: false,
                },
            ],
            productIdByType,
        })

        expect(body.scopes).toEqual([
            { temporaryId: 'import-scope-0', name: 'PAVIMENTO ÚNICO' },
        ])
        expect(body.elements).toHaveLength(3)
        expect(
            body.elements.every(
                (element) => element.scopeTemporaryId === 'import-scope-0'
            )
        ).toBe(true)
        expect(body.elements.map((element) => element.name)).toEqual([
            'PA.4',
            'VA.301a',
            'PA.9',
        ])
    })

    test('dedupes a renamed group that matches an existing scope with another group already claiming it', () => {
        const secondGroup: ImportScopeGroup = {
            scopeName: '4° SUBSOLO',
            pilares: [{ ...pilarRow, name: 'PA.9' }],
            vigas: [],
            lajes: [],
        }

        const body = buildImportRequestBody({
            quoteId: 42,
            groups: [group, secondGroup],
            selections: [
                {
                    scopeName: '5° SUBSOLO',
                    targetScopeName: 'TÉRREO',
                    createScope: true,
                    includePilares: true,
                    includeVigas: true,
                    includeLajes: true,
                },
                {
                    scopeName: '4° SUBSOLO',
                    targetScopeName: 'térreo',
                    createScope: true,
                    includePilares: true,
                    includeVigas: false,
                    includeLajes: false,
                },
            ],
            productIdByType,
            existingScopesByNormalizedName: new Map([['térreo', 7]]),
        })

        expect(body.scopes).toEqual([
            {
                temporaryId: 'import-scope-0',
                name: 'TÉRREO',
                existingScopeId: 7,
            },
        ])
        expect(
            body.elements.every(
                (element) => element.scopeTemporaryId === 'import-scope-0'
            )
        ).toBe(true)
    })
})
