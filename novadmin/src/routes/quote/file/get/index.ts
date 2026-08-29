import { list } from 'data/quoteFile'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import { QuoteFileGetRequest, QuoteFileGetResponse } from './types'
import { extractParams } from './functions'
import { checkPermissions } from 'auth/permissions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const quoteFileGet: Handler = async (
    req: Request<{}, {}, {}, QuoteFileGetRequest>,
    res: Response<QuoteFileGetResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_document:list'],
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
            listResult = await list(params)
        } catch (error) {
            console.error('Error fetching quoteFiles:', error)
            return InternalServerError(res, 'Failed to fetch quoteFiles')
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

        console.error('Error in quoteFileGet handler:', error)
        return InternalServerError(res)
    }
}
