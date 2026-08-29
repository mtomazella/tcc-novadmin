import { list } from 'data/user'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import { UserGetRequest, UserGetResponse } from './types'
import { extractParams, validatePermissions } from './functions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const userGet: Handler = async (
    req: Request<{}, {}, {}, UserGetRequest>,
    res: Response<UserGetResponse>
): Promise<any> => {
    try {
        let params
        try {
            params = extractParams(req)
        } catch (error) {
            if (error instanceof RequestParameterValidationError) {
                return BadRequest(res, error.message)
            }
            throw error
        }

        validatePermissions({
            user: res.locals?.user,
            params,
        })

        let listResult
        try {
            listResult = await list({ ...params })
        } catch (error) {
            console.error('Error fetching users:', error)
            return InternalServerError(res, 'Failed to fetch users')
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

        console.error('Error in userGet handler:', error)
        return InternalServerError(res)
    }
}
