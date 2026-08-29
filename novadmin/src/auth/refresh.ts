import { validateSession } from 'data/session'
import { AuthenticationError } from 'error/index'
import { generateToken } from './login'

export const refresh = async ({
    token,
    userId,
}: {
    token: string
    userId: number
}) => {
    if (!token) {
        throw new AuthenticationError('Missing token')
    }
    if (!userId) {
        throw new AuthenticationError('Missing userId')
    }

    const session = await validateSession({ token, userId })

    if (!session) {
        throw new AuthenticationError(
            'Invalid session or session expired. Please log in again.'
        )
    }

    return generateToken(userId)
}
