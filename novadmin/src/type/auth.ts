export type Session = {
    token: string
    userId: number
    createdAt: Date
    expiresAt: Date
    usedAt: Date | null
    deletedAt: Date | null
}
