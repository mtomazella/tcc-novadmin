export class RequestParameterValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'RequestParameterValidationError'
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AuthenticationError'
    }
}

export class PermissionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PermissionError'
    }
}

export class SelectError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SelectError'
    }
}
export class UpsertError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UpsertError'
    }
}
