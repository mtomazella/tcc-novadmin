import config from 'config/index'
import { getLoginUser } from 'data/auth'
import { getUserRefreshTokens, upsert } from 'data/session'
import { list } from 'data/account'
import { AuthenticationError } from 'error/index'
import { SignJWT } from 'jose'
import { Session } from 'type/auth'

export const login = async ({
    username,
    password,
}: {
    username: string
    password: string
}) => {
    if (!username) {
        throw new AuthenticationError('Missing username')
    }
    if (!password) {
        throw new AuthenticationError('Missing password')
    }

    const userId = await getLoginUser({ username, password })

    if (!userId) {
        throw new AuthenticationError('Invalid username or password')
    }

    return generateToken(userId)
}

export const generateToken = async (userId: number) => {
    const { data: userList } = await list({
        id: userId,
        includePermissions: true,
        activationStatus: 'active',
        page: 1,
        limit: 1,
    })

    if (!userList.length) {
        throw new AuthenticationError('User not found')
    }

    const user = userList[0]

    const jwt = await new SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${config.auth.jwtExpirationSeconds}s`)
        .sign(new TextEncoder().encode(config.auth.jwtSecret))

    const getRefreshToken = await getRefreshNewToken({
        userId: user.id,
    })

    return {
        token: jwt,
        expiresAt: new Date(
            Date.now() + Number(config.auth.jwtExpirationSeconds) * 1000
        ),
        refresh: {
            token: getRefreshToken.token,
            expiresAt: getRefreshToken.expiresAt,
        },
        user,
    }
}

const getRefreshNewToken = async ({
    userId,
}: {
    userId: number
}): Promise<{ token: string; expiresAt: Date }> => {
    try {
        const userTokens = await getUserRefreshTokens({ userId })

        const longestTimeToExpireToken = userTokens.data.reduce<
            Session | undefined
        >((prev, current) => {
            if (!prev) return current
            return prev.expiresAt > current.expiresAt ? prev : current
        }, undefined)

        if (
            longestTimeToExpireToken &&
            longestTimeToExpireToken.expiresAt.getTime() - Date.now() >
                Number(config.auth.refreshTokenTimeNotCreateNewSeconds) * 1000
        ) {
            return {
                token: longestTimeToExpireToken.token,
                expiresAt: longestTimeToExpireToken.expiresAt,
            }
        }

        const newToken = await new SignJWT()
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(`${config.auth.refreshTokenExpirationSeconds}s`)
            .sign(new TextEncoder().encode(config.auth.jwtSecret))

        const expiresAt = new Date(
            Date.now() +
                Number(config.auth.refreshTokenExpirationSeconds) * 1000
        )

        upsert({
            record: {
                token: newToken,
                userId,
                expiresAt,
                usedAt: null,
            },
        })

        return {
            token: newToken,
            expiresAt,
        }
    } catch (error) {
        console.error('Error getting refresh new token:', error)
        throw new AuthenticationError('Failed to get refresh token')
    }
}
