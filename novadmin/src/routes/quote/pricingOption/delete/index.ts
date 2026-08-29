import { remove } from 'data/quotePricingOption'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Request, Response } from 'express'
import {
    QuotePricingOptionDeleteRequest,
    QuotePricingOptionDeleteResponse,
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

export const quotePricingOptionDelete = async (
    req: Request<{}, {}, {}, QuotePricingOptionDeleteRequest>,
    res: Response<QuotePricingOptionDeleteResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['quote_pricing_option:delete'],
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
            result = await remove(params)
        } catch (error) {
            if (error instanceof UpsertError) {
                return Conflict(res, error.message)
            }

            console.error('Error deleting quotePricingOption:', error)
            return InternalServerError(
                res,
                'Failed to delete quotePricingOption'
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

        console.error('Error in quotePricingOptionDelete handler:', error)
        return InternalServerError(res)
    }
}
