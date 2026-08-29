import { extractNumber } from 'utils/request'

export const extractProductConsumption = (
    raw: any,
    context: string
): {
    commercialPercentage: number | null
    projectPercentage: number | null
    consumptionRates: {
        icChapa1: number | null
        icRipa1: number | null
        icChapa2: number | null
        icRipa2: number | null
        icChapa3: number | null
        icRipa3: number | null
    }
} => {
    const n = (field: any, msg: string): number | null =>
        (extractNumber(field, { allowUndefined: true, errorMessage: msg }) as
            | number
            | undefined) ?? null

    return {
        commercialPercentage: n(
            raw?.commercialPercentage,
            `Invalid ${context} commercialPercentage`
        ),
        projectPercentage: n(
            raw?.projectPercentage,
            `Invalid ${context} projectPercentage`
        ),
        consumptionRates: {
            icChapa1: n(
                raw?.consumptionRates?.icChapa1,
                `Invalid ${context} consumptionRates.icChapa1`
            ),
            icRipa1: n(
                raw?.consumptionRates?.icRipa1,
                `Invalid ${context} consumptionRates.icRipa1`
            ),
            icChapa2: n(
                raw?.consumptionRates?.icChapa2,
                `Invalid ${context} consumptionRates.icChapa2`
            ),
            icRipa2: n(
                raw?.consumptionRates?.icRipa2,
                `Invalid ${context} consumptionRates.icRipa2`
            ),
            icChapa3: n(
                raw?.consumptionRates?.icChapa3,
                `Invalid ${context} consumptionRates.icChapa3`
            ),
            icRipa3: n(
                raw?.consumptionRates?.icRipa3,
                `Invalid ${context} consumptionRates.icRipa3`
            ),
        },
    }
}
