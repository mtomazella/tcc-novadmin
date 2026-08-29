import { unlockDocument } from 'data/quote'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import {
    QuoteDocumentUnlockPostBody,
    QuoteDocumentUnlockPostResponse,
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

export const quoteDocumentUnlockPost: Handler = async (
    req: Request<{}, {}, QuoteDocumentUnlockPostBody, {}>,
    res: Response<QuoteDocumentUnlockPostResponse>
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
            result = await unlockDocument({
                id: params.id,
                userId: res.locals?.user?.id,
            })
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }
            console.error('Error unlocking quoteDocument:', error)
            return InternalServerError(res, 'Failed to unlock quoteDocument')
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in quoteDocumentUnlockPost handler:', error)
        return InternalServerError(res)
    }
}
