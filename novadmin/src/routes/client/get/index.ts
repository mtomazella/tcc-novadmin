import { list } from 'data/client'
import { PermissionError, RequestParameterValidationError } from 'error/index'
import { Handler, Request, Response } from 'express'
import { ClientGetRequest, ClientGetResponse } from './types'
import { extractParams } from './functions'
import { checkPermissions } from 'auth/permissions'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    Success,
} from 'utils/response'

export const clientGet: Handler = async (
    req: Request<{}, {}, {}, ClientGetRequest>,
    res: Response<ClientGetResponse>
): Promise<any> => {
    try {
        checkPermissions({
            userPermissions: res.locals?.user?.permissions,
            requiredPermissions: ['client:list'],
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
            console.error('Error fetching clients:', error)
            return InternalServerError(res, 'Failed to fetch clients')
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

        console.error('Error in clientGet handler:', error)
        return InternalServerError(res)
    }
}
