import { upsert } from 'data/quotePricingOption'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import {
    QuotePricingOptionPostBody,
    QuotePricingOptionPostResponse,
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

export const quotePricingOptionPost: Handler = async (
    req: Request<{}, {}, QuotePricingOptionPostBody, {}>,
    res: Response<QuotePricingOptionPostResponse>
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
            result = await upsert({ record: params.record })
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }
            console.error('Error upserting quotePricingOption:', error)
            return InternalServerError(
                res,
                'Failed to upsert quotePricingOption'
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

        console.error('Error in quotePricingOptionPost handler:', error)
        return InternalServerError(res)
    }
}
