import { unlockCosts } from 'data/quote'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import { QuoteCostsUnlockPostBody, QuoteCostsUnlockPostResponse } from './types'
import { extractParams } from './functions'
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'
import { checkPermissions } from 'auth/permissions'

export const quoteCostsUnlockPost: Handler = async (
    req: Request<{}, {}, QuoteCostsUnlockPostBody, {}>,
    res: Response<QuoteCostsUnlockPostResponse>
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
            result = await unlockCosts({
                id: params.id,
                userId: res.locals?.user?.id,
            })
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }
            console.error('Error unlocking quoteCosts:', error)
            return InternalServerError(res, 'Failed to unlock quoteCosts')
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in quoteCostsUnlockPost handler:', error)
        return InternalServerError(res)
    }
}
