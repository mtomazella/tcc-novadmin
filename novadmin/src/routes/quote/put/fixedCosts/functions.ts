import { Request } from 'express'
import { QuoteFixedCostsPutParams, QuoteFixedCostsPutBody } from './types'
import { extractNumber, extractString } from 'utils/request'
import { extractProductConsumption } from '../../extractProductConsumption'
import {
    QuoteFixedCostValueType,
    QuoteFixedCostValueTypes,
} from '@novadmin/lib/types'

export const extractParams = (
    req: Request<{}, {}, QuoteFixedCostsPutBody, {}>
): QuoteFixedCostsPutParams => {
    const { record } = req.body ?? {}

    const params = {
        record: {},
    } as QuoteFixedCostsPutParams

    params.record.id = extractNumber(record.id, {
        allowUndefined: false,
        errorMessage: 'Invalid id',
    }) as number

    params.record.pricingOptions = []

    for (const index in record.pricingOptions) {
        const option = record.pricingOptions[index]

        params.record.pricingOptions.push({
            id: extractString(option.id, {
                allowUndefined: true,
                errorMessage: `Invalid pricingOption id for index ${index}`,
            }) as string | undefined,
            name: extractString(option.name, {
                allowUndefined: false,
                errorMessage: `Invalid pricingOption name for index ${index}`,
            }) as string,
            description: extractString(option.description, {
                allowUndefined: true,
                errorMessage: `Invalid pricingOption description for index ${index}`,
            }) as string | undefined,
            valueReto: extractNumber(option.valueReto, {
                allowUndefined: false,
                errorMessage: `Invalid pricingOption valueReto for index ${index}`,
            }) as number,
            valueCambotado: extractNumber(option.valueCambotado, {
                allowUndefined: false,
                errorMessage: `Invalid pricingOption valueCambotado for index ${index}`,
            }) as number,
            valueGarfo: extractNumber(option.valueGarfo, {
                allowUndefined: false,
                errorMessage: `Invalid pricingOption valueGarfo for index ${index}`,
            }) as number,
        })
    }

    params.record.fixedCosts = []

    for (const index in record.fixedCosts) {
        const cost = record.fixedCosts[index]

        params.record.fixedCosts.push({
            id: extractString(cost.id, {
                allowUndefined: false,
                errorMessage: `Invalid fixedCost id for index ${index}`,
            }) as string,
            name: extractString(cost.name, {
                allowUndefined: false,
                errorMessage: `Invalid fixedCost name for index ${index}`,
            }) as string,
            description: extractString(cost.description, {
                allowUndefined: true,
                errorMessage: `Invalid fixedCost description for index ${index}`,
            }) as string | undefined,
            valueType: extractString(cost.valueType, {
                allowUndefined: false,
                errorMessage: `Invalid fixedCost valueType for index ${index}`,
                validationFunction: (value) =>
                    QuoteFixedCostValueTypes.includes(
                        (value ?? '') as QuoteFixedCostValueType
                    ),
            }) as QuoteFixedCostValueType,
            value: extractNumber(cost.value, {
                allowUndefined: false,
                errorMessage: `Invalid fixedCost value for index ${index}`,
            }) as number,
        })
    }

    params.record.selectedPricingOptionId = extractString(
        record.selectedPricingOptionId as string | undefined,
        {
            allowUndefined: true,
            errorMessage: 'Invalid selectedPricingOptionId',
        }
    ) as string | undefined

    params.record.productConsumption = []

    for (const index in record.productConsumption) {
        const consumption = record.productConsumption[index]

        params.record.productConsumption.push({
            id: extractNumber(consumption.id, {
                allowUndefined: false,
                errorMessage: `Invalid productConsumption id for index ${index}`,
            }) as number,
            category: extractString(consumption.category, {
                allowUndefined: true,
                defaultValue: '',
                errorMessage: `Invalid productConsumption category for index ${index}`,
            }) as string,
            ...extractProductConsumption(
                consumption,
                `productConsumption[${index}]`
            ),
        })
    }

    return params
}
