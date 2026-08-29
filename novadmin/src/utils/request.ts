import { RequestParameterValidationError } from 'error/index'
import { ActivationStatusFilter } from '@novadmin/lib/types'

export const extractActivationStatus = (
    activationStatus: string | undefined,
    {
        allowUndefined = true,
        defaultStatus = 'active',
        errorMessage = 'Invalid activation status',
    }: {
        allowUndefined?: boolean
        defaultStatus?: ActivationStatusFilter
        errorMessage?: string
    } = {}
): ActivationStatusFilter => {
    if (!activationStatus) {
        if (!allowUndefined) {
            throw new RequestParameterValidationError(errorMessage)
        }

        return defaultStatus
    }

    const status = activationStatus.toLowerCase()

    if (!['active', 'deleted', 'all'].includes(status)) {
        throw new RequestParameterValidationError(errorMessage)
    }

    return status as ActivationStatusFilter
}

export const extractNumber = (
    value: string | null | undefined | number,
    {
        allowUndefined = false,
        defaultValue = undefined,
        errorMessage = 'Invalid number',
        allowNullAsNull = false,
    }: {
        allowUndefined?: boolean
        defaultValue?: number | undefined | null
        errorMessage?: string
        allowNullAsNull?: boolean
    } = {}
) => {
    if (value === null && allowNullAsNull) {
        return null
    }

    const trimmed = value?.toString()?.trim()

    if (allowNullAsNull && trimmed === 'null') {
        return null
    }

    if (trimmed === '' || value === undefined) {
        if (!allowUndefined) {
            throw new RequestParameterValidationError(errorMessage)
        } else {
            return defaultValue
        }
    }

    const numberValue = Number(trimmed)

    if (isNaN(numberValue)) {
        throw new RequestParameterValidationError(errorMessage)
    }

    return numberValue
}

export const validateNumber = (
    value: number,
    {
        min = 0,
        max,
        element = 'Value',
    }: {
        min?: number
        max?: number
        element?: string
    }
) => {
    if (min !== undefined && value < min) {
        throw new RequestParameterValidationError(
            `${element} must be greater than or equal to ${min}`
        )
    }

    if (max !== undefined && value > max) {
        throw new RequestParameterValidationError(
            `${element} must be less than or equal to ${max}`
        )
    }

    return value
}

export const extractBoolean = (
    value: string | boolean | undefined,
    {
        allowUndefined = false,
        defaultValue = false,
        errorMessage = 'Invalid boolean',
    }: {
        allowUndefined?: boolean
        defaultValue?: boolean
        errorMessage?: string
    } = {}
) => {
    const trimmed = value?.toString()?.trim()?.toLowerCase()

    if (trimmed === '' || value === undefined) {
        if (!allowUndefined) {
            throw new RequestParameterValidationError(errorMessage)
        } else {
            return defaultValue
        }
    }

    if (trimmed === 'true') {
        return true
    } else if (trimmed === 'false') {
        return false
    } else {
        throw new RequestParameterValidationError(errorMessage)
    }
}

export const extractString = (
    value: string | undefined,
    {
        allowUndefined = false,
        defaultValue = undefined,
        errorMessage = 'Invalid string',
        validationFunction = () => true,
    }: {
        allowUndefined?: boolean
        defaultValue?: string | undefined | null
        errorMessage?: string
        validationFunction?: (value: string | undefined) => boolean
    } = {}
) => {
    const trimmed = value?.toString()?.trim()

    if (trimmed === '' || value === undefined) {
        if (!allowUndefined) {
            throw new RequestParameterValidationError(errorMessage)
        } else {
            return defaultValue
        }
    }

    if (!validationFunction(trimmed)) {
        throw new RequestParameterValidationError(errorMessage)
    }

    return trimmed
}

export const extractDate = (
    value: string | undefined,
    {
        allowUndefined = false,
        defaultValue = null,
        errorMessage = 'Invalid date',
    }: {
        allowUndefined?: boolean
        defaultValue?: Date | null
        errorMessage?: string
    } = {}
): Date | null => {
    try {
        const string = extractString(value, {
            allowUndefined,
        })

        if (string === null || string === undefined) {
            if (!allowUndefined) {
                throw new RequestParameterValidationError(errorMessage)
            }
            return defaultValue
        }

        const date = new Date(string)
        if (isNaN(date.getTime())) {
            throw new RequestParameterValidationError(errorMessage)
        }
        return date
    } catch (error) {
        throw new RequestParameterValidationError(errorMessage)
    }
}

export const extractStringList = (
    value: string | undefined,
    {
        allowUndefined = false,
        defaultValue = [],
        errorMessage = 'Invalid string list',
        allowedValues = [],
    }: {
        allowUndefined?: boolean
        defaultValue?: string[]
        errorMessage?: string
        allowedValues?: string[]
    } = {}
): string[] => {
    if (value === undefined || value.trim() === '') {
        if (!allowUndefined) {
            throw new RequestParameterValidationError(errorMessage)
        } else {
            return defaultValue
        }
    }

    try {
        let list = value
            .split(',')
            .map((item) => (item ?? '').trim())
            .filter((item) => item !== '')

        if (allowedValues && allowedValues.length) {
            list = list.filter((item) => allowedValues.includes(item))
        }

        return list
    } catch (error) {
        throw new RequestParameterValidationError(errorMessage)
    }
}
