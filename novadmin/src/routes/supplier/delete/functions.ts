import { Request } from "express"
import { SupplierDeleteParams, SupplierDeleteRequest } from "./types"
import { extractNumber } from "utils/request"

export const extractParams = (
    req: Request<{}, {}, {}, SupplierDeleteRequest>
): SupplierDeleteParams => {
    const {
        id,
    } = req.query ?? {}

    const params: SupplierDeleteParams = {
    } as SupplierDeleteParams


    params.id = extractNumber(id, {
        allowUndefined: false,
        errorMessage: "Invalid id",
    }) as number

    return params
}