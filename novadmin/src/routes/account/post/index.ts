import { upsert } from 'data/account'
import {
    PermissionError,
    RequestParameterValidationError,
    UpsertError,
} from 'error/index'
import { Handler, Request, Response } from 'express'
import { UserPostBody, UserPostResponse } from './types'
import { extractParams } from './functions'
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'
import { checkPermissions } from 'auth/permissions'

export const userPost: Handler = async (
    req: Request<{}, {}, UserPostBody, {}>,
    res: Response<UserPostResponse>
): Promise<any> => {
    try {
        // Creating vs editing a user map to two different frontend
        // permissions (web:user:add / web:user:edit), same as
        // useHasPermission's canAdd/canEdit split on the Users page.
        const requiredPermission = req.body?.record?.id
            ? 'web:user:edit'
            : 'web:user:add'

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
            console.error('Error upserting user:', error)
            return InternalServerError(res, 'Failed to upsert user')
        }

        return Success(res, {
            meta: params,
            data: result,
        })
    } catch (error) {
        if (error instanceof PermissionError) {
            return Forbidden(res, error.message)
        }

        console.error('Error in userPost handler:', error)
        return InternalServerError(res)
    }
}
