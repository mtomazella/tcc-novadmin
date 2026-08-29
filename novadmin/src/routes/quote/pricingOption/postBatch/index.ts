import { batchUpsert } from 'data/quotePricingOption'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import {
    QuotePricingOptionBatchPostBody,
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

export const quotePricingOptionBatchPost: Handler = async (
    req: Request<{}, {}, QuotePricingOptionBatchPostBody, {}>,
    res: Response<QuoteFixedCostBatchPostResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_pricing_option:upsert'],
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
            console.error('Error batch upserting quotePricingOption:', error)
            return InternalServerError(
                res,
                'Failed to batch upsert quotePricingOption'
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

        console.error('Error in quotePricingOptionBatchPost handler:', error)
        return InternalServerError(res)
    }
}
