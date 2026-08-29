export const toLocaleISOString = (date: Date | null): string | null => {
    if (!date) return date
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}Z`
}

export const msToHuman = (ms: number) => {
    const units: [string, number][] = [
        ['day', 86400000],
        ['hour', 3600000],
        ['minute', 60000],
        ['second', 1000],
    ]

    let remaining = ms
    const parts = []

    for (const [name, value] of units) {
        const amount = Math.floor(remaining / value)
        if (amount) {
            parts.push(`${amount} ${name}${amount !== 1 ? 's' : ''}`)
            remaining %= value
        }
    }

    return parts.length ? parts.join(', ') : '0 seconds'
}
