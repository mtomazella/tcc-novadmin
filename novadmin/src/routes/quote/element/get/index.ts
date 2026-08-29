import { list } from 'data/quoteElement'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import { QuoteElementGetRequest, QuoteElementGetResponse } from './types'
import { extractParams } from './functions'
import { checkPermissions } from 'auth/permissions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const quoteElementGet: Handler = async (
    req: Request<{}, {}, {}, QuoteElementGetRequest>,
    res: Response<QuoteElementGetResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_element:list'],
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
            listResult = await list({ ...params })
        } catch (error) {
            console.error('Error fetching quoteElements:', error)
            return InternalServerError(res, 'Failed to fetch quoteElements')
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

        console.error('Error in quoteElementGet handler:', error)
        return InternalServerError(res)
    }
}
