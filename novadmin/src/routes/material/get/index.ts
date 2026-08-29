import { list } from 'data/material'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import { MaterialGetRequest, MaterialGetResponse } from './types'
import { extractParams } from './functions'
import { checkPermissions } from 'auth/permissions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const materialGet: Handler = async (
    req: Request<{}, {}, {}, MaterialGetRequest>,
    res: Response<MaterialGetResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['material:list'],
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
            console.error('Error fetching materials:', error)
            return InternalServerError(res, 'Failed to fetch materials')
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

        console.error('Error in materialGet handler:', error)
        return InternalServerError(res)
    }
}
