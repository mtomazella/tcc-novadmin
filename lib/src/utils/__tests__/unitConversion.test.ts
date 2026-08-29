import { describe, expect, test } from 'vitest'
import {
    centsToReais,
    reaisToCents,
    decimalToPercent,
    percentToDecimal,
    toLocalDecimal,
    parseLocalizedNumber,
    formatCurrency,
} from '../unitConversion.js'

describe('centsToReais', () => {
    test('divides by 100', () => {
        expect(centsToReais(100)).toBe(1)
        expect(centsToReais(150)).toBe(1.5)
        expect(centsToReais(0)).toBe(0)
        expect(centsToReais(1050)).toBe(10.5)
    })
})

describe('reaisToCents', () => {
    test('multiplies by 100 and rounds', () => {
        expect(reaisToCents(1)).toBe(100)
        expect(reaisToCents(1.5)).toBe(150)
        expect(reaisToCents(0)).toBe(0)
        expect(reaisToCents(10.5)).toBe(1050)
    })

    test('rounds to avoid floating-point drift', () => {
        // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754; Math.round clamps it to 30
        expect(reaisToCents(0.1 + 0.2)).toBe(30)
    })
})

describe('decimalToPercent', () => {
    test('multiplies by 100', () => {
        expect(decimalToPercent(0.05)).toBeCloseTo(5)
        expect(decimalToPercent(1)).toBe(100)
        expect(decimalToPercent(0)).toBe(0)
        expect(decimalToPercent(0.1234)).toBeCloseTo(12.34)
    })
})

describe('percentToDecimal', () => {
    test('divides by 100', () => {
        expect(percentToDecimal(5)).toBeCloseTo(0.05)
        expect(percentToDecimal(100)).toBe(1)
        expect(percentToDecimal(0)).toBe(0)
        expect(percentToDecimal(12.34)).toBeCloseTo(0.1234)
    })

    test('is the inverse of decimalToPercent', () => {
        expect(percentToDecimal(decimalToPercent(0.07))).toBeCloseTo(0.07)
    })
})

describe('toLocalDecimal', () => {
    test('replaces dot with comma', () => {
        expect(toLocalDecimal(10.5)).toBe('10,5')
        expect(toLocalDecimal(1.23)).toBe('1,23')
    })

    test('returns empty string for null or undefined', () => {
        expect(toLocalDecimal(null)).toBe('')
        expect(toLocalDecimal(undefined)).toBe('')
    })

    test('handles integers without decimal point', () => {
        expect(toLocalDecimal(10)).toBe('10')
        expect(toLocalDecimal(0)).toBe('0')
    })

    test('applies fixed precision when provided', () => {
        expect(toLocalDecimal(10.5, 2)).toBe('10,50')
        expect(toLocalDecimal(1, 2)).toBe('1,00')
        expect(toLocalDecimal(10.567, 2)).toBe('10,57')
    })
})

describe('parseLocalizedNumber', () => {
    test('parses Brazilian decimal notation (comma as separator)', () => {
        expect(parseLocalizedNumber('10,5')).toBe(10.5)
        expect(parseLocalizedNumber('10,50')).toBe(10.5)
        expect(parseLocalizedNumber('1,23')).toBe(1.23)
    })

    test('strips thousands separator when comma is present', () => {
        expect(parseLocalizedNumber('1.000,50')).toBe(1000.5)
        expect(parseLocalizedNumber('10.000,00')).toBe(10000)
    })

    test('parses standard dot-decimal (programmatic values)', () => {
        expect(parseLocalizedNumber('10.5')).toBe(10.5)
        expect(parseLocalizedNumber('1.23')).toBe(1.23)
    })

    test('returns 0 for empty or whitespace input', () => {
        expect(parseLocalizedNumber('')).toBe(0)
        expect(parseLocalizedNumber('   ')).toBe(0)
    })

    test('returns 0 for non-numeric input', () => {
        expect(parseLocalizedNumber('abc')).toBe(0)
    })

    test('is the inverse of toLocalDecimal', () => {
        expect(parseLocalizedNumber(toLocalDecimal(10.5))).toBe(10.5)
        expect(parseLocalizedNumber(toLocalDecimal(1000.25, 2))).toBe(1000.25)
    })
})

describe('formatCurrency', () => {
    test('formats cents as R$ with two decimal places', () => {
        expect(formatCurrency(100)).toBe('R$ 1,00')
        expect(formatCurrency(150)).toBe('R$ 1,50')
        expect(formatCurrency(1050)).toBe('R$ 10,50')
        expect(formatCurrency(0)).toBe('R$ 0,00')
    })

    test('uses toLocalDecimal internally (comma decimal separator)', () => {
        expect(formatCurrency(1099)).toBe('R$ 10,99')
        expect(formatCurrency(100000)).toBe('R$ 1000,00')
    })
})
