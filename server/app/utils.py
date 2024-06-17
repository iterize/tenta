import time
import random


def timestamp():
    """Return current UTC time as unixtime float."""
    return time.time()


def backoff():
    """Return exponential backoff intervals for retries."""
    value = 1
    while True:
        yield value + random.random() - 0.5
        if value < 256:  # Limit the backoff to about 5 minutes
            value *= 2
