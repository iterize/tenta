import starlette.exceptions


class _CustomError(starlette.exceptions.HTTPException):
    def __init__(self):
        super().__init__(self.STATUS_CODE, self.DETAIL)


class BadRequestError(_CustomError):
    STATUS_CODE = 400
    DETAIL = "Bad Request"


class UnauthorizedError(_CustomError):
    STATUS_CODE = 401
    DETAIL = "Unauthorized"


class NotFoundError(_CustomError):
    STATUS_CODE = 404
    DETAIL = "Not Found"


class ConflictError(_CustomError):
    STATUS_CODE = 409
    DETAIL = "Conflict"


class InternalServerError(_CustomError):
    STATUS_CODE = 500
    DETAIL = "Internal Server Error"


class NotImplementedError(_CustomError):
    STATUS_CODE = 501
    DETAIL = "Not Implemented"
