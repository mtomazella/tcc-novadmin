import { Response } from 'express'

export const Success = (response: Response, data: Record<string, any>) => {
    return response.status(200).json(data)
}

export const Created = (response: Response, data: Record<string, any>) => {
    return response.status(201).json(data)
}

export const BadRequest = (
    response: Response,
    message: string | unknown = 'Bad Request'
) => {
    return response.status(400).json({
        error: message,
    })
}

export const Unauthorized = (
    response: Response,
    message: string | unknown = 'Unauthorized'
) => {
    return response.status(401).json({
        error: message,
    })
}

export const Forbidden = (
    response: Response,
    message: string | unknown = 'Forbidden'
) => {
    return response.status(403).json({
        error: message,
    })
}

export const Conflict = (
    response: Response,
    message: string | unknown = 'Conflict'
) => {
    return response.status(409).json({
        error: message,
    })
}

export const InternalServerError = (
    response: Response,
    message: string | unknown = 'Internal Server Error'
) => {
    return response.status(500).json({
        error: message,
    })
}
