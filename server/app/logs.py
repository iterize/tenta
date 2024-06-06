import logging
import time

import app.settings as settings


class Color:
    red = "\x1b[31m"
    yellow = "\x1b[33m"
    blue = "\x1b[34m"
    magenta = "\x1b[35m"
    cyan = "\x1b[36m"
    white = "\x1b[38m"


class Style:
    bold = "\x1b[1m"
    reset = "\x1b[0m"


class CustomFormatter(logging.Formatter):
    _FMTS = {
        logging.DEBUG: (
            f"{Color.cyan}%(asctime)s{Style.reset} | "
            f"{Style.bold}{Color.blue}%(levelname)-8s{Style.reset} | "
            f"{Color.magenta}%(name)s:%(lineno)s{Style.reset} - %(message)s"
        ),
        logging.INFO: (
            f"{Color.cyan}%(asctime)s{Style.reset} | "
            f"{Style.bold}{Color.white}%(levelname)-8s{Style.reset} | "
            f"{Color.magenta}%(name)s:%(lineno)s{Style.reset} - %(message)s"
        ),
        logging.WARNING: (
            f"{Color.cyan}%(asctime)s{Style.reset} | "
            f"{Style.bold}{Color.yellow}%(levelname)-8s{Style.reset} | "
            f"{Color.magenta}%(name)s:%(lineno)s{Style.reset} - %(message)s"
        ),
        logging.ERROR: (
            f"{Color.cyan}%(asctime)s{Style.reset} | "
            f"{Style.bold}{Color.red}%(levelname)-8s{Style.reset} | "
            f"{Color.magenta}%(name)s:%(lineno)s{Style.reset} - %(message)s"
        ),
    }

    def __init__(self):
        super().__init__()
        self._formatters = dict()
        for key, value in self._FMTS.items():
            formatter = logging.Formatter(fmt=value, datefmt="%a %Y-%m-%d %H:%M:%S")
            formatter.converter = time.gmtime  # Log in UTC rather than local time
            self._formatters[key] = formatter

    def format(self, record):
        return self._formatters[record.levelno].format(record)


def configure():
    """Remove library handlers and handle messages at the root logger for consistency.

    Note that this does not affect the logs of watchfiles, which reloads the server on
    file changes during development. This is because uvicorn cannot load watchfiles
    at runtime, so it's loaded before the server starts. watchfiles is not active in
    production.

    """
    for name in logging.root.manager.loggerDict.keys():
        # Remove all existing handlers and let messages propagate to the root logger
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True
    # Initialize our handler and custom formatter
    formatter = CustomFormatter()
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    # Assign our handler to the root logger
    logging.root.handlers = [handler]
    logging.root.setLevel(
        logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG
    )
