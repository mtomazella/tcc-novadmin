import { list, lock } from 'data/quoteScope'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import { QuoteScopeGetRequest, QuoteScopeGetResponse } from './types'
import { extractParams } from './functions'
import { checkPermissions } from 'auth/permissions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const quoteScopeGet: Handler = async (
    req: Request<{}, {}, {}, QuoteScopeGetRequest>,
    res: Response<QuoteScopeGetResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_scope:list'],
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

        let listResult
        try {
            listResult = await list({ ...params, userId: res.locals?.user?.id })
        } catch (error) {
            console.error('Error fetching quoteScopes:', error)
            return InternalServerError(res, 'Failed to fetch quoteScopes')
        }

        return Success(res, {
            meta: params,
            count: listResult.count,
            data: listResult.data,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in quoteScopeGet handler:', error)
        return InternalServerError(res)
    }
}
