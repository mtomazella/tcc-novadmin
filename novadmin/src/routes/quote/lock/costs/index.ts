import { lockCosts } from 'data/quote'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import {
    QuoteDocumentLockPostBody,
    QuoteDocumentLockPostResponse,
} from './types'
import { extractParams } from './functions'
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'
import { checkPermissions } from 'auth/permissions'

export const quoteCostsLockPost: Handler = async (
    req: Request<{}, {}, QuoteDocumentLockPostBody, {}>,
    res: Response<QuoteDocumentLockPostResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote:upsert'],
        })

        let params
        try {
            params = extractParams(req)
        } catch (error) {
            if (error instanceof RequestParameterValidationError) {
                return BadRequest(res, error.message)
            }
            throw error
        }

        let result
        try {
            result = await lockCosts({
                id: params.id,
                userId: res.locals?.user?.id,
            })
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }
            console.error('Error locking quoteCosts:', error)
            return InternalServerError(res, 'Failed to lock quoteCosts')
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in quoteCostsLockPost handler:', error)
        return InternalServerError(res)
    }
}
