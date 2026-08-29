import { validateToken } from 'auth/validateToken'
import { AuthenticationError } from 'error/index'
import { Handler } from 'express'
import { InternalServerError, Unauthorized } from 'src/utils/response'

export const authMiddleware: Handler = async (req, res, next): Promise<any> => {
    const token = req.headers['authorization'] as string | undefined

    try {
        const user = await validateToken(token)

        if (!user) {
            throw new AuthenticationError('Invalid token')
        }

        res.locals.user = user
        return next()
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return Unauthorized(res, error.message)
        }
        return InternalServerError(res)
    }
}
