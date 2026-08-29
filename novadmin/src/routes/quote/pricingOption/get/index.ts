import { list } from 'data/quotePricingOption'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import {
    QuotePricingOptionGetRequest,
    QuotePricingOptionGetResponse,
} from './types'
import { extractParams } from './functions'
import { checkPermissions } from 'auth/permissions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const quotePricingOptionGet: Handler = async (
    req: Request<{}, {}, {}, QuotePricingOptionGetRequest>,
    res: Response<QuotePricingOptionGetResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_pricing_option:list'],
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
            console.error('Error fetching quotePricingOptions:', error)
            return InternalServerError(
                res,
                'Failed to fetch quotePricingOptions'
            )
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

        console.error('Error in quotePricingOptionGet handler:', error)
        return InternalServerError(res)
    }
}
