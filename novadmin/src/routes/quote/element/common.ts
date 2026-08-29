import { RequestParameterValidationError } from 'error/index'
import {
    QuoteElement,
    QuoteElementLajeValues,
    QuoteElementPilarValues,
    QuoteElementType,
    QuoteElementValues,
    QuoteElementVigaValues,
} from '@novadmin/lib/types'
import { extractBoolean, extractNumber, extractString } from 'utils/request'

export const validateAndExtractUpsertRecord = (
    record: Record<string, any>
): QuoteElement => {
    const result: Partial<Omit<QuoteElement, 'values'>> &
        Pick<QuoteElement, 'values'> = {
        values: {} as QuoteElementValues,
    }

    if (!record) {
        throw new RequestParameterValidationError(
            'Missing record in request body'
        )
    }

    result.id = extractNumber(record.id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    result.quoteId = extractNumber(record.quoteId, {
        allowUndefined: false,
        errorMessage: 'Invalid quoteId',
    }) as number

    result.scopeId = extractNumber(record.scopeId, {
        allowUndefined: true,
        errorMessage: 'Invalid scopeId',
        allowNullAsNull: true,
    }) as number | null

    result.productId = extractNumber(record.productId, {
        allowUndefined: false,
        errorMessage: 'Invalid productId',
    }) as number

    result.type = extractString(record.type, {
        allowUndefined: false,
        errorMessage: 'Invalid type',
        validationFunction: (value) =>
            ['pilar', 'viga', 'laje'].includes(value ?? ''),
    }) as QuoteElementType

    result.name = extractString(record.name, {
        allowUndefined: false,
        errorMessage: 'Invalid name',
        validationFunction: (value) =>
            value!.length > 0 && value!.length <= 150,
    }) as string

    if (!!record.values && typeof record.values !== 'object') {
        throw new RequestParameterValidationError(
            'Invalid or missing values object'
        )
    }
    if (!record.values) {
        record.values = {}
    }

    if (result.type === 'pilar') {
        result.values = {} as QuoteElementPilarValues

        result.values.fundoCm = extractNumber(record.values?.fundoCm, {
            allowUndefined: true,
            defaultValue: 0,
            errorMessage: 'Invalid fundoCm for pilar',
        }) as number

        result.values.lateralCm = extractNumber(record.values?.lateralCm, {
            allowUndefined: true,
            defaultValue: 0,
            errorMessage: 'Invalid lateralCm for pilar',
        }) as number

        result.values.peDireitoM = extractNumber(record.values?.peDireitoM, {
            allowUndefined: true,
            defaultValue: 0,
            errorMessage: 'Invalid peDireitoM for pilar',
        }) as number

        result.values.quantidade = extractNumber(record.values?.quantidade, {
            allowUndefined: true,
            defaultValue: 1,
            errorMessage: 'Invalid quantidade for pilar',
        }) as number

        result.values.cambotado = extractBoolean(record.values?.cambotado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid cambotado for pilar',
        }) as boolean

        result.values.needsGastalho = extractBoolean(
            record.values?.needsGastalho,
            {
                allowUndefined: true,
                defaultValue: false,
                errorMessage: 'Invalid needsGastalho for pilar',
            }
        ) as boolean

        result.values.ripado = extractBoolean(record.values?.ripado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid ripado for pilar',
        }) as boolean

        result.values.aparente = extractBoolean(record.values?.aparente, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid aparente for pilar',
        }) as boolean

        result.values.paginado = extractBoolean(record.values?.paginado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid paginado for pilar',
        }) as boolean
    } else if (result.type === 'viga') {
        result.values = {} as QuoteElementVigaValues

        result.values.fundoCm = extractNumber(record.values?.fundoCm, {
            allowUndefined: true,
            defaultValue: 0,
            errorMessage: 'Invalid fundoCm for viga',
        }) as number

        result.values.lateralCm = extractNumber(record.values?.lateralCm, {
            allowUndefined: true,
            defaultValue: 0,
            errorMessage: 'Invalid lateralCm for viga',
        }) as number

        result.values.comprimentoCm = extractNumber(
            record.values?.comprimentoCm,
            {
                allowUndefined: true,
                defaultValue: 0,
                errorMessage: 'Invalid comprimentoCm for viga',
            }
        ) as number

        result.values.alturaLajeLateralACm = extractNumber(
            record.values?.alturaLajeLateralACm,
            {
                allowUndefined: true,
                defaultValue: 0,
                errorMessage: 'Invalid alturaLajeLateralACm for viga',
            }
        ) as number

        result.values.alturaLajeLateralBCm = extractNumber(
            record.values?.alturaLajeLateralBCm,
            {
                allowUndefined: true,
                defaultValue: 0,
                errorMessage: 'Invalid alturaLajeLateralBCm for viga',
            }
        ) as number

        result.values.quantidade = extractNumber(record.values?.quantidade, {
            allowUndefined: true,
            defaultValue: 1,
            errorMessage: 'Invalid quantidade for viga',
        }) as number

        result.values.tipo = extractString(record.values?.tipo, {
            allowUndefined: true,
            defaultValue: 'interno',
            errorMessage: 'Invalid tipo for viga',
            validationFunction: (value) =>
                ['interno', 'borda'].includes(value ?? ''),
        }) as QuoteElementVigaValues['tipo']

        result.values.cambotado = extractBoolean(record.values?.cambotado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid cambotado for pilar',
        }) as boolean

        result.values.needsGarfo = extractBoolean(record.values?.needsGarfo, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid needsGarfo for viga',
        }) as boolean

        result.values.ripado = extractBoolean(record.values?.ripado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid ripado for pilar',
        }) as boolean

        result.values.aparente = extractBoolean(record.values?.aparente, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid aparente for pilar',
        }) as boolean

        result.values.paginado = extractBoolean(record.values?.paginado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid paginado for pilar',
        }) as boolean
    } else if (result.type === 'laje') {
        result.values = {} as QuoteElementLajeValues

        result.values.areaM2 = extractNumber(record.values?.areaM2, {
            allowUndefined: true,
            defaultValue: 0,
            errorMessage: 'Invalid areaM2 for laje',
        }) as number

        result.values.perimetroM = extractNumber(record.values?.perimetroM, {
            allowUndefined: true,
            defaultValue: 0,
            errorMessage: 'Invalid perimetroM for laje',
        }) as number

        result.values.fechamentoM2 = extractNumber(
            record.values?.fechamentoM2,
            {
                allowUndefined: true,
                defaultValue: 0,
                errorMessage: 'Invalid fechamentoM2 for laje',
            }
        ) as number

        result.values.quantidade = extractNumber(record.values?.quantidade, {
            allowUndefined: true,
            defaultValue: 1,
            errorMessage: 'Invalid quantidade for laje',
        }) as number

        result.values.ripado = extractBoolean(record.values?.ripado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid ripado for laje',
        }) as boolean

        result.values.aparente = extractBoolean(record.values?.aparente, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid aparente for laje',
        }) as boolean

        result.values.paginado = extractBoolean(record.values?.paginado, {
            allowUndefined: true,
            defaultValue: false,
            errorMessage: 'Invalid paginado for laje',
        }) as boolean
    } else {
        throw new RequestParameterValidationError('Unsupported element type')
    }

    return result as QuoteElement
}
