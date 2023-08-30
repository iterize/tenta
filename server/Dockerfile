FROM python:3.11.0-slim

LABEL maintainer="Felix Böhm <felix@felixboehm.dev>"
LABEL source="https://github.com/tum-esm/insert-name-here"

# Install poetry
ENV POETRY_VERSION=1.4.2 \
    POETRY_HOME=/opt/poetry
RUN python -m venv $POETRY_HOME && \
    $POETRY_HOME/bin/pip install poetry==${POETRY_VERSION}
ENV PATH="${PATH}:${POETRY_HOME}/bin"

# Copy dependency information
COPY pyproject.toml poetry.lock /

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --no-ansi --no-interaction

EXPOSE 8000

# Read commit hash and branch name as build arguments
ARG commit_sha branch_name
LABEL commit_sha=${commit_sha} branch_name=${branch_name}
ENV COMMIT_SHA=${commit_sha} BRANCH_NAME=${branch_name}

COPY /app /app

CMD poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info
