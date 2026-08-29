import { batchUpsert } from 'data/quoteFixedCost'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import {
    QuoteFixedCostBatchPostBody,
    QuoteFixedCostBatchPostResponse,
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

export const quoteFixedCostBatchPost: Handler = async (
    req: Request<{}, {}, QuoteFixedCostBatchPostBody, {}>,
    res: Response<QuoteFixedCostBatchPostResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_fixed_cost:upsert'],
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
            result = await batchUpsert({ records: params.records })
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }
            console.error('Error batch upserting quoteFixedCost:', error)
            return InternalServerError(
                res,
                'Failed to batch upsert quoteFixedCost'
            )
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in quoteFixedCostBatchPost handler:', error)
        return InternalServerError(res)
    }
}
