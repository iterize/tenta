import starlette.exceptions
import starlette.responses


########################################################################################
# Custom starlette error handlers
########################################################################################


async def handler(request, exc):
    """Return JSON instead of the default text/plain for handled exceptions."""
    return starlette.responses.JSONResponse(
        status_code=exc.status_code,
        content={"details": exc.detail},
        headers=exc.headers,
    )


async def panic(request, exc):
    """Return JSON instead of the default text/plain for errors."""
    return starlette.responses.JSONResponse(
        status_code=500,
        content={"details": "Internal Server Error"},
    )


########################################################################################
# Custom error class to reduce duplication when raising errors
########################################################################################


class _CustomError(starlette.exceptions.HTTPException):
    def __init__(self):
        super().__init__(self.STATUS_CODE, self.DETAIL)


########################################################################################
# Standard HTTP errors
########################################################################################


class BadRequestError(_CustomError):
    STATUS_CODE = 400
    DETAIL = "Bad Request"


class UnauthorizedError(_CustomError):
    STATUS_CODE = 401
    DETAIL = "Unauthorized"


class ForbiddenError(_CustomError):
    STATUS_CODE = 403
    DETAIL = "Forbidden"


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
