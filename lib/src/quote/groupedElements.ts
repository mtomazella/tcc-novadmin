import type { Product } from 'types/entity.js'
import type {
    QuoteElement,
    QuoteElementModifier,
    QuoteElementType,
    QuoteGroupedElement,
} from 'types/quote.js'
import { getElementM2 } from './elements.js'

type EffectiveConsumptionEntry = {
    category: string
    commercialPercentage: number | null
    projectPercentage: number | null
}

export const buildCategory = ({
    type,
    productId,
    modifiers,
}: {
    type: QuoteElementType
    productId: Product['id']
    modifiers: Partial<Record<QuoteElementModifier, boolean>>
}) =>
    [
        `${type}+${productId}`,
        ...Object.keys(modifiers)
            .sort()
            .filter((key) => modifiers[key as QuoteElementModifier] === true),
    ].join('+')

export const splitCategory = (category: string) => {
    const [type, productId, ...modifiers] = category.split('+')
    const modifierMap: Record<QuoteElementModifier, boolean> = modifiers.reduce(
        (acc, modifier) => {
            acc[modifier as QuoteElementModifier] = true
            return acc
        },
        {
            cambotado: false,
            ripado: false,
            aparente: false,
            paginado: false,
            needsGarfo: false,
            needsGastalho: false,
            garfo: false,
            gastalho: false,
            fundoDeViga: false,
        } as Record<QuoteElementModifier, boolean>
    )
    return {
        type: type as QuoteElementType,
        productId: Number(productId),
        modifiers: modifierMap,
    }
}

const getCategoryName = ({ productName }: { productName: string }) =>
    productName

export const elementsToGroupedElements = (
    elements: QuoteElement[]
): Record<string, QuoteGroupedElement> => {
    const groupedElements: Record<string, QuoteGroupedElement> = {}

    elements.forEach((element) => {
        const currentValue = groupedElements[element.category!] ?? {}
        groupedElements[element.category!] = {
            category: element.category!,
            categoryName: element.product
                ? getCategoryName({
                      productName: element.product.name,
                  })
                : undefined,
            elements: [...(currentValue?.elements || []), element],
            quantity:
                (currentValue?.quantity || 0) +
                (element.values?.quantidade || 0),
            totalM2: (currentValue?.totalM2 || 0) + getElementM2(element),
        }
    })

    return groupedElements
}

export const enrichGroupedElementsWithName = ({
    groupedElements,
    products,
}: {
    groupedElements: Record<string, QuoteGroupedElement>
    products: Product[]
}) => {
    return Object.keys(groupedElements).reduce(
        (acc, key) => {
            const group = groupedElements[key]
            const firstElement = group.elements[0]
            const product = products.find(
                (p) => p.id === firstElement.productId
            )
            acc[key] = {
                ...group,
                categoryName: getCategoryName({
                    productName: product ? product.name : key,
                }),
            }
            return acc
        },
        {} as Record<string, QuoteGroupedElement>
    )
}

export const calculateGroupPercentageTotals = ({
    groupedElements,
    productConsumption,
}: {
    groupedElements: Record<string, QuoteGroupedElement>
    productConsumption: EffectiveConsumptionEntry[]
}) => {
    const consumptionByCategory = new Map(
        productConsumption.map((e) => [e.category, e])
    )
    const groups: Record<string, QuoteGroupedElement> = {}

    for (const key in groupedElements) {
        const group = groupedElements[key]
        const entry = consumptionByCategory.get(key)
        groups[key] = {
            ...group,
            commercialTotalM2:
                (group.totalM2 ?? 0) * ((entry?.commercialPercentage ?? 0) + 1),
            projectTotalM2:
                entry?.projectPercentage != null
                    ? (group.totalM2 ?? 0) * entry.projectPercentage
                    : undefined,
        }
    }

    return groups
}
