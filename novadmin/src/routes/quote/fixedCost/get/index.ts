import { list } from 'data/quoteFixedCost'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import { QuoteFixedCostGetRequest, QuoteFixedCostGetResponse } from './types'
import { extractParams } from './functions'
import { checkPermissions } from 'auth/permissions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const quoteFixedCostGet: Handler = async (
    req: Request<{}, {}, {}, QuoteFixedCostGetRequest>,
    res: Response<QuoteFixedCostGetResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_fixed_cost:list'],
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
            console.error('Error fetching quoteFixedCosts:', error)
            return InternalServerError(res, 'Failed to fetch quoteFixedCosts')
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

        console.error('Error in quoteFixedCostGet handler:', error)
        return InternalServerError(res)
    }
}
