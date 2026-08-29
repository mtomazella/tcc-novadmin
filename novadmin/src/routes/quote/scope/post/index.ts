import { upsert } from 'data/quoteScope'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import { QuoteScopePostBody, QuoteScopePostResponse } from './types'
import { extractParams } from './functions'
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'
import { checkPermissions } from 'auth/permissions'

export const quoteScopePost: Handler = async (
    req: Request<{}, {}, QuoteScopePostBody, {}>,
    res: Response<QuoteScopePostResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_scope:upsert'],
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
            result = await upsert({
                record: params.record,
                userId: res.locals?.user?.id,
            })
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }
            console.error('Error upserting quoteScope:', error)
            return InternalServerError(res, 'Failed to upsert quoteScope')
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in quoteScopePost handler:', error)
        return InternalServerError(res)
    }
}
