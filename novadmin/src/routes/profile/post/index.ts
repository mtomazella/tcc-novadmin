import { upsert } from 'data/profile'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import { ProfilePostBody, ProfilePostResponse } from './types'
import { extractParams } from './functions'
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'
import { checkPermissions } from 'auth/permissions'

export const profilePost: Handler = async (
    req: Request<{}, {}, ProfilePostBody, {}>,
    res: Response<ProfilePostResponse>
): Promise<any> => {
    try {
        const requiredPermission = req.body?.record?.id
            ? 'web:profile:edit'
            : 'web:profile:add'

        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: [requiredPermission],
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
            console.error('Error upserting profile:', error)
            return InternalServerError(res, 'Failed to upsert profile')
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in profilePost handler:', error)
        return InternalServerError(res)
    }
}
