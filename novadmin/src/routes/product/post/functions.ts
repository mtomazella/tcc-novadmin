import { Request } from 'express'
import { ProductPostParams, ProductPostBody } from './types'
import { RequestParameterValidationError } from 'error/index'
import { extractBoolean, extractNumber, extractString } from 'utils/request'
import { QuoteElementType, QuoteElementTypes } from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, ProductPostBody, {}>
): ProductPostParams => {
    const { record } = req.body ?? {}

    const params: ProductPostParams = { record: {} } as ProductPostParams

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    params.record.id = extractNumber(record.id, {
        allowUndefined: true,
        allowNullAsNull: true,
        defaultValue: undefined,
        errorMessage: 'Invalid id in record',
    }) as number | undefined

    params.record.name = extractString(record.name, {
        allowUndefined: false,
        errorMessage: 'Missing name in record',
    }) as string

    params.record.shorthand = extractString(record.shorthand, {
        allowUndefined: false,
        errorMessage: 'Missing shorthand in record',
    }) as string

    params.record.description = extractString(record.description, {
        allowUndefined: true,
    }) as string | undefined

    params.record.typeOnQuote = extractString(record.typeOnQuote, {
        allowUndefined: true,
        validationFunction: (value) =>
            QuoteElementTypes.includes(value as QuoteElementType),
        errorMessage: 'Invalid typeOnQuote in record',
    }) as QuoteElementType | undefined

    params.record.modifiers = {
        cambotado: extractBoolean(record.modifiers?.cambotado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid cambotado in modifiers',
        }) as boolean,
        gastalho: extractBoolean(record.modifiers?.gastalho, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid gastalho in modifiers',
        }) as boolean,
        ripado: extractBoolean(record.modifiers?.ripado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid ripado in modifiers',
        }) as boolean,
        aparente: extractBoolean(record.modifiers?.aparente, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid aparente in modifiers',
        }) as boolean,
        paginado: extractBoolean(record.modifiers?.paginado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid paginado in modifiers',
        }) as boolean,
        garfo: extractBoolean(record.modifiers?.garfo, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid garfo in modifiers',
        }) as boolean,
        needsGarfo: extractBoolean(record.modifiers?.needsGarfo, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid needsGarfo in modifiers',
        }) as boolean,
        needsGastalho: extractBoolean(record.modifiers?.needsGastalho, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid needsGastalho in modifiers',
        }) as boolean,
        fundoDeViga: extractBoolean(record.modifiers?.fundoDeViga, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid fundoDeViga in modifiers',
        }) as boolean,
    }

    params.record.commercialPercentage = extractNumber(
        record.commercialPercentage,
        {
            allowUndefined: true,
            allowNullAsNull: true,
            defaultValue: null,
            errorMessage: 'Invalid commercialPercentage in record',
        }
    ) as number | null

    params.record.projectPercentage = extractNumber(record.projectPercentage, {
        allowUndefined: true,
        allowNullAsNull: true,
        defaultValue: null,
        errorMessage: 'Invalid projectPercentage in record',
    }) as number | null

    params.record.consumptionRates = {
        icChapa1: extractNumber(record.consumptionRates?.icChapa1, {
            allowUndefined: true,
            allowNullAsNull: true,
            defaultValue: null,
            errorMessage: 'Invalid icChapa1 in consumptionRates',
        }) as number | null,
        icRipa1: extractNumber(record.consumptionRates?.icRipa1, {
            allowUndefined: true,
            allowNullAsNull: true,
            defaultValue: null,
            errorMessage: 'Invalid icRipa1 in consumptionRates',
        }) as number | null,
        icChapa2: extractNumber(record.consumptionRates?.icChapa2, {
            allowUndefined: true,
            allowNullAsNull: true,
            defaultValue: null,
            errorMessage: 'Invalid icChapa2 in consumptionRates',
        }) as number | null,
        icRipa2: extractNumber(record.consumptionRates?.icRipa2, {
            allowUndefined: true,
            allowNullAsNull: true,
            defaultValue: null,
            errorMessage: 'Invalid icRipa2 in consumptionRates',
        }) as number | null,
        icChapa3: extractNumber(record.consumptionRates?.icChapa3, {
            allowUndefined: true,
            allowNullAsNull: true,
            defaultValue: null,
            errorMessage: 'Invalid icChapa3 in consumptionRates',
        }) as number | null,
        icRipa3: extractNumber(record.consumptionRates?.icRipa3, {
            allowUndefined: true,
            allowNullAsNull: true,
            defaultValue: null,
            errorMessage: 'Invalid icRipa3 in consumptionRates',
        }) as number | null,
    }

    return params
}
