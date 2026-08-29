export const stringToBoolean = (
    value: string,
    {
        undefinedIs = undefined,
    }: { undefinedIs?: boolean | undefined | null } = {}
): boolean | undefined | null => {
    if (value === undefined || value === null) {
        return undefinedIs
    }

    value = value.toLowerCase().trim()

    if (value === 'true') {
        return true
    } else if (value === 'false') {
        return false
    } else {
        throw new Error(`Invalid boolean string: ${value}`)
    }
}

export const padLeft = (str: string, size: number) => {
    while (str.length < size) str = '0' + str
    return str
}

export const padNumberLeft = (num: number, size: number) => {
    return padLeft(num.toString(), size)
}
