import enum
import hashlib
import logging
import secrets

import passlib.context
import starlette.authentication
import starlette.requests

import app.database as database
import app.errors as errors


########################################################################################
# Password Utilities
########################################################################################


_CONTEXT = passlib.context.CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password):
    """Hash the given password and return the hash as string."""
    return _CONTEXT.hash(password)


def verify_password(password, password_hash):
    """Return true if the password results in the hash, else False."""
    return _CONTEXT.verify(password, password_hash)


########################################################################################
# Token Utilities
########################################################################################


def generate_token():
    """Create and return a random string useful for authentication."""
    return secrets.token_hex(32)


def hash_token(token):
    """Hash the given token and return the hash as string."""
    return hashlib.sha512(token.encode("utf-8")).hexdigest()


########################################################################################
# Authentication middleware
########################################################################################


class AuthenticationMiddleware:
    """Validates Bearer authorization headers and provides the requester's identity.

    The structure is adapted from Starlette's own AuthenticationMiddleware class.
    """

    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger(__name__)

    async def _authenticate(self, request):
        # Extract the access token from the authorization header
        if "authorization" not in request.headers:
            return None
        try:
            scheme, access_token = request.headers["authorization"].split()
        except ValueError:
            self.logger.warning("Malformed authorization header")
            return None
        if scheme.lower() != "bearer":
            self.logger.warning("Malformed authorization header")
            return None
        # Check if we have the access token in the database
        query, arguments = database.parametrize(
            identifier="authenticate",
            arguments={"access_token_hash": hash_token(access_token)},
        )
        elements = await request.state.dbpool.fetch(query, *arguments)
        elements = database.dictify(elements)
        # If the result set is empty, the access token is invalid
        if len(elements) == 0:
            self.logger.warning("Invalid access token")
            return None
        # Return the requester's identity
        return elements[0]["user_identifier"]

    async def __call__(self, scope, receive, send):
        # Only process HTTP requests, not websockets
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        # Authenticate and pass the result through to the route
        request = starlette.requests.Request(scope)
        request.state.identity = await self._authenticate(request)
        await self.app(scope, receive, send)


########################################################################################
# Authorization helpers
########################################################################################


@enum.unique
class Relationship(enum.IntEnum):
    NONE = 0  # The requester is not authenticated
    DEFAULT = 1  # The requester is authenticated, but no relationship exists
    OWNER = 2


class Resource:
    """Base class for resources that need authorization checks."""

    def __init__(self, identifier):
        self.identifier = identifier

    async def _authorize(self, request):
        """Return the relationship between the requester and the resource."""
        raise NotImplementedError


class User(Resource):
    async def _authorize(self, request):
        if request.state.identity is None:
            return Relationship.NONE
        if request.state.identity == self.identifier:
            return Relationship.OWNER
        return Relationship.DEFAULT


class Network(Resource):
    async def _authorize(self, request):
        if request.state.identity is None:
            return Relationship.NONE
        query, arguments = database.parametrize(
            identifier="authorize-resource-network",
            arguments={
                "user_identifier": request.state.identity,
                "network_identifier": self.identifier,
            },
        )
        elements = await request.state.dbpool.fetch(query, *arguments)
        elements = database.dictify(elements)
        if len(elements) == 0:
            raise errors.NotFoundError
        return (
            Relationship.DEFAULT
            if elements[0]["user_identifier"] is None
            else Relationship.OWNER
        )


class Sensor(Resource):
    async def _authorize(self, request):
        if request.state.identity is None:
            return Relationship.NONE
        query, arguments = database.parametrize(
            identifier="authorize-resource-sensor",
            arguments={
                "user_identifier": request.state.identity,
                "network_identifier": self.identifier["network_identifier"],
                "sensor_identifier": self.identifier["sensor_identifier"],
            },
        )
        elements = await request.state.dbpool.fetch(query, *arguments)
        elements = database.dictify(elements)
        if len(elements) == 0:
            raise errors.NotFoundError
        return (
            Relationship.DEFAULT
            if elements[0]["user_identifier"] is None
            else Relationship.OWNER
        )


async def authorize(request, resource):
    """Check what relationship (ReBAC) the requester has with the resource."""
    return await resource._authorize(request)
