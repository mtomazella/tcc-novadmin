import { Request } from "express"
import { MaterialDeleteParams, MaterialDeleteRequest } from "./types"
import { extractNumber } from "utils/request"

export const extractParams = (
    req: Request<{}, {}, {}, MaterialDeleteRequest>
): MaterialDeleteParams => {
    const {
        id,
    } = req.query ?? {}

    const params: MaterialDeleteParams = {
    } as MaterialDeleteParams


    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: "Invalid id",
    }) as number

    return params
}