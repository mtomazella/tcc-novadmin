import { Request } from 'express'
import { QuotePutParams, QuotePutBody } from './types'
import { extractBoolean, extractNumber, extractString } from 'utils/request'
import { extractProductConsumption } from '../../extractProductConsumption'
import { QuoteElementType } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, QuotePutBody, {}>
): QuotePutParams => {
    const { record } = req.body ?? {}

    const params = {
        record: {},
    } as QuotePutParams

    params.record.id = extractNumber(record.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    params.record.products = {}
    for (const key of Object.keys(record.products ?? {})) {
        const p = (record.products ?? {})[key]
        params.record.products[key] = {
            id: extractNumber(p.id, {
                allowUndefined: false,
                errorMessage: `Invalid products[${key}].id`,
            }) as number,
            name: extractString(p.name, {
                allowUndefined: false,
                errorMessage: `Invalid products[${key}].name`,
            }) as string,
            description: extractString(p.description, {
                allowUndefined: true,
                errorMessage: `Invalid products[${key}].description`,
            }) as string | undefined,
            shorthand: extractString(p.shorthand, {
                allowUndefined: true,
                errorMessage: `Invalid products[${key}].shorthand`,
            }) as string | undefined,
            typeOnQuote: extractString(p.typeOnQuote, {
                allowUndefined: true,
                errorMessage: `Invalid products[${key}].typeOnQuote`,
            }) as QuoteElementType | undefined,
            modifiers: {
                cambotado: extractBoolean(p.modifiers?.cambotado, {
                    errorMessage: `Invalid products[${key}].modifiers.cambotado`,
                }),
                gastalho: extractBoolean(p.modifiers?.gastalho, {
                    errorMessage: `Invalid products[${key}].modifiers.gastalho`,
                }),
                ripado: extractBoolean(p.modifiers?.ripado, {
                    errorMessage: `Invalid products[${key}].modifiers.ripado`,
                }),
                aparente: extractBoolean(p.modifiers?.aparente, {
                    errorMessage: `Invalid products[${key}].modifiers.aparente`,
                }),
                paginado: extractBoolean(p.modifiers?.paginado, {
                    errorMessage: `Invalid products[${key}].modifiers.paginado`,
                }),
                garfo: extractBoolean(p.modifiers?.garfo, {
                    errorMessage: `Invalid products[${key}].modifiers.garfo`,
                }),
                needsGarfo: extractBoolean(p.modifiers?.needsGarfo, {
                    allowUndefined: true,
                    defaultValue: false,
                    errorMessage: `Invalid products[${key}].modifiers.needsGarfo`,
                }),
                needsGastalho: extractBoolean(p.modifiers?.needsGastalho, {
                    allowUndefined: true,
                    defaultValue: false,
                    errorMessage: `Invalid products[${key}].modifiers.needsGastalho`,
                }),
                fundoDeViga: extractBoolean(p.modifiers?.fundoDeViga, {
                    allowUndefined: true,
                    defaultValue: false,
                    errorMessage: `Invalid products[${key}].modifiers.fundoDeViga`,
                }),
            },
            ...extractProductConsumption(p, `products[${key}]`),
        }
    }

    return params
}
