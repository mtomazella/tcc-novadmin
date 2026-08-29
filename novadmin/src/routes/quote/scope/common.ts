import { extractBoolean, extractNumber, extractString } from 'utils/request'
import { extractProductConsumption } from '../extractProductConsumption'
import {
    MaterialType,
    MaterialTypes,
    QuoteFixedCostValueType,
    QuoteFixedCostValueTypes,
    QuoteScope,
} from '@novadmin/lib/types'

export const validateAndExtractUpsertRecord = (record: Record<string, any>) => {
    const parsed: Record<string, any> & {
        materials: Record<string, any>
        materialSelections: Array<{
            category: string
            materialType: MaterialType
            materialId: number
            overrides: {
                value?: number
            }
        }>
    } = {
        materials: {},
        materialSelections: [],
    }

    parsed.id = extractNumber(record.id, {
        allowUndefined: true,
        errorMessage: 'Invalid id',
    }) as number | undefined

    parsed.quoteId = extractNumber(record.quoteId, {
        allowUndefined: false,
        errorMessage: 'Invalid quoteId',
    }) as number

    parsed.name = extractString(record.name, {
        allowUndefined: false,
        errorMessage: 'Invalid name',
    }) as string

    parsed.scopeType = extractString(record.scopeType, {
        allowUndefined: true,
        errorMessage: 'Invalid scopeType',
    }) as string | undefined

    parsed.supplyType = extractString(record.supplyType, {
        allowUndefined: true,
        errorMessage: 'Invalid supplyType',
    }) as string | undefined

    parsed.boundary = extractString(record.boundary, {
        allowUndefined: true,
        errorMessage: 'Invalid boundary',
    }) as string | undefined

    parsed.ceilingHeight = extractString(record.ceilingHeight, {
        allowUndefined: true,
        errorMessage: 'Invalid ceilingHeight',
    }) as string | undefined

    parsed.projectFileName = extractString(record.projectFileName, {
        allowUndefined: true,
        errorMessage: 'Invalid projectFileName',
    }) as string | undefined

    parsed.gastalhoCount = extractNumber(record.gastalhoCount, {
        allowUndefined: true,
        defaultValue: 0,
        errorMessage: 'Invalid gastalhoCount',
    }) as number

    parsed.garfoBordaEnabled = extractBoolean(record.garfoBordaEnabled, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid garfoBordaEnabled',
    }) as boolean

    parsed.garfoInternoEnabled = extractBoolean(record.garfoInternoEnabled, {
        allowUndefined: true,
        defaultValue: false,
        errorMessage: 'Invalid garfoInternoEnabled',
    }) as boolean

    parsed.fundoAdicionalCount = extractNumber(record.fundoAdicionalCount, {
        allowUndefined: true,
        defaultValue: 0,
        errorMessage: 'Invalid fundoAdicionalCount',
    }) as number

    parsed.tiraAdicionalCount = extractNumber(record.tiraAdicionalCount, {
        allowUndefined: true,
        defaultValue: 0,
        errorMessage: 'Invalid tiraAdicionalCount',
    }) as number

    parsed.observations = extractString(record.observations, {
        allowUndefined: true,
        defaultValue: '',
        errorMessage: 'Invalid observations',
    }) as string

    if (!record.overriddenFixedCosts) {
        record.overriddenFixedCosts = []
    }
    if (!Array.isArray(record.overriddenFixedCosts)) {
        throw new Error('Invalid overriddenFixedCosts')
    }

    parsed.overriddenFixedCosts = []

    for (const index in record.overriddenFixedCosts) {
        const override = record.overriddenFixedCosts[index]

        parsed.overriddenFixedCosts.push({
            id: extractString(override.id, {
                allowUndefined: false,
                errorMessage: `Invalid overriddenFixedCost id for index ${index}`,
            }) as string,
            name: extractString(override.name, {
                allowUndefined: false,
                errorMessage: `Invalid overriddenFixedCost name for index ${index}`,
            }) as string,
            description: extractString(override.description, {
                allowUndefined: true,
                errorMessage: `Invalid overriddenFixedCost description for index ${index}`,
            }) as string | undefined,
            valueType: extractString(override.valueType, {
                allowUndefined: false,
                errorMessage: `Invalid overriddenFixedCost valueType for index ${index}`,
                validationFunction: (value) =>
                    QuoteFixedCostValueTypes.includes(
                        (value ?? '') as QuoteFixedCostValueType
                    ),
            }) as QuoteFixedCostValueType,
            value: extractNumber(override.value, {
                allowUndefined: false,
                errorMessage: `Invalid overriddenFixedCost value for index ${index}`,
            }) as number,
        })
    }

    if (!record.overriddenProductConsumption) {
        record.overriddenProductConsumption = []
    }
    if (!Array.isArray(record.overriddenProductConsumption)) {
        throw new Error('Invalid overriddenProductConsumption')
    }

    parsed.overriddenProductConsumption = []

    for (const index in record.overriddenProductConsumption) {
        const override = record.overriddenProductConsumption[index]

        parsed.overriddenProductConsumption.push({
            id: extractNumber(override.id, {
                allowUndefined: true,
                defaultValue: 0,
                errorMessage: `Invalid overriddenProductConsumption id for index ${index}`,
            }) as number,
            category: extractString(override.category, {
                allowUndefined: true,
                defaultValue: '',
                errorMessage: `Invalid overriddenProductConsumption category for index ${index}`,
            }) as string,
            ...extractProductConsumption(
                override,
                `overriddenProductConsumption[${index}]`
            ),
        })
    }

    if (!record.materials) {
        parsed.materials = {}
    }
    if (
        typeof record.materials !== 'object' ||
        Array.isArray(record.materials)
    ) {
        throw new Error('Invalid materials')
    }

    parsed.materials = {}

    for (const [materialKey, material] of Object.entries(record.materials)) {
        const materialId = extractNumber(materialKey, {
            allowUndefined: false,
            errorMessage: `Invalid material id key ${materialKey}`,
        }) as number

        parsed.materials[String(materialId)] = {
            id: materialId,
            supplierId: extractNumber((material as any)?.supplierId, {
                allowUndefined: false,
                errorMessage: `Invalid material supplierId for key ${materialKey}`,
            }) as number,
            sku: extractString((material as any)?.sku, {
                allowUndefined: false,
                errorMessage: `Invalid material sku for key ${materialKey}`,
            }) as string,
            name: extractString((material as any)?.name, {
                allowUndefined: false,
                errorMessage: `Invalid material name for key ${materialKey}`,
            }) as string,
            description: extractString((material as any)?.description, {
                allowUndefined: true,
                errorMessage: `Invalid material description for key ${materialKey}`,
            }) as string | undefined,
            type: extractString((material as any)?.type, {
                allowUndefined: false,
                errorMessage: `Invalid material type for key ${materialKey}`,
                validationFunction: (value) =>
                    MaterialTypes.includes((value ?? '') as MaterialType),
            }) as MaterialType,
            value: extractNumber((material as any)?.value, {
                allowUndefined: false,
                errorMessage: `Invalid material value for key ${materialKey}`,
            }) as number,
        }
    }

    if (!record.materialSelections) {
        parsed.materialSelections = []
    }
    if (!Array.isArray(record.materialSelections)) {
        throw new Error('Invalid materialSelections')
    }

    parsed.materialSelections = []

    for (const index in record.materialSelections) {
        const selection = record.materialSelections[index]

        const category = extractString(selection?.category, {
            allowUndefined: true,
            defaultValue: '',
            errorMessage: `Invalid materialSelection category for index ${index}`,
        }) as string

        const materialType = extractString(selection?.materialType, {
            allowUndefined: false,
            errorMessage: `Invalid materialSelection materialType for index ${index}`,
            validationFunction: (value) =>
                MaterialTypes.includes((value ?? '') as MaterialType),
        }) as MaterialType

        const materialId = extractNumber(selection?.materialId, {
            allowUndefined: false,
            errorMessage: `Invalid materialSelection materialId for index ${index}`,
        }) as number

        if (!parsed.materials[String(materialId)]) {
            throw new Error(
                `Invalid materialSelection materialId for index ${index}`
            )
        }

        const overrideValue = extractNumber(selection?.overrides?.value, {
            allowUndefined: true,
            errorMessage: `Invalid materialSelection overrides.value for index ${index}`,
        }) as number | undefined

        parsed.materialSelections.push({
            category,
            materialType,
            materialId,
            overrides: {
                ...(overrideValue !== undefined
                    ? { value: overrideValue }
                    : {}),
            },
        })
    }

    return parsed as unknown as QuoteScope
}
