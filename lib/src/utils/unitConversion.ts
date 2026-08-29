export const cmToM = (cm: number): number => cm / 100

export const mToCm = (m: number): number => m * 100

export const cm2ToM2 = (cm2: number): number => cm2 / 10000

export const m2ToCm2 = (m2: number): number => m2 * 10000

export const round = (value: number, decimals: number = 2): number => {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
}

export const falsyExceptZero = (value: number | undefined): boolean =>
    value === 0 ? false : !value

export const normalizeNumber = (value: unknown): number => {
    const parsed = Number(value ?? 0)
    return Number.isFinite(parsed) ? parsed : 0
}

export const roundToTwo = (value: number) => Math.round(value * 100) / 100

export const centsToReais = (cents: number): number => cents / 100
export const reaisToCents = (reais: number): number => Math.round(reais * 100)
export const decimalToPercent = (dec: number): number => dec * 100
export const percentToDecimal = (pct: number): number => pct / 100

export const toLocalDecimal = (
    v: number | null | undefined,
    precision?: number
): string => {
    if (v == null) return ''
    if (precision != null) return v.toFixed(precision).replace('.', ',')
    return String(v).replace('.', ',')
}

export const parseLocalizedNumber = (raw: string): number => {
    const trimmed = raw.trim()
    if (!trimmed) return 0
    const normalized = trimmed.includes(',')
        ? trimmed.replace(/\./g, '').replace(',', '.')
        : trimmed
    const n = parseFloat(normalized)
    return isNaN(n) ? 0 : n
}

export const formatCurrency = (cents: number) => {
    const reais = centsToReais(cents)
    const [intPart, decPart] = reais.toFixed(2).split('.')
    const intWithThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `R$ ${intWithThousands},${decPart}`
}
