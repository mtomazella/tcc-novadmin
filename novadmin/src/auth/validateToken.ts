import { list } from 'data/account'
import { AuthenticationError } from 'error/index'
import { jwtVerify } from 'jose'

export const validateToken = async (token: string | undefined) => {
    if (!token) {
        throw new AuthenticationError('Missing validation token')
    }

    if (!token.startsWith('Bearer ')) {
        throw new AuthenticationError('Invalid token format')
    }

    const tokenWithoutBearer = token.split(' ')[1]

    let result
    try {
        result = await jwtVerify(
            tokenWithoutBearer,
            new TextEncoder().encode(process.env.JWT_SECRET),
            {
                algorithms: ['HS256'],
            }
        )

        if (!result || !result.payload || !result.payload?.userId) {
            throw new AuthenticationError('Invalid token')
        }

        const user = await list({
            id: result.payload.userId as number,
            includePermissions: true,
            activationStatus: 'active',
            page: 1,
            limit: 1,
        })

        if (!user.data.length) {
            throw new AuthenticationError('User not found')
        }

        return user.data[0]
    } catch (error) {
        if ((error as any)?.code === 'ERR_JWT_EXPIRED') {
            throw new AuthenticationError('Token expired')
        }
        if ((error as any)?.code === 'ERR_JWS_INVALID') {
            throw new AuthenticationError('Invalid token')
        }
        if ((error as any)?.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            throw new AuthenticationError('Please stop')
        }
        throw new AuthenticationError('Invalid token')
    }
}
