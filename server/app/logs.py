import logging


formatter = logging.Formatter(
    fmt="{asctime} | {levelname:8} | {msg}",
    datefmt="%a %Y-%m-%d %H:%M:%S %z",
    style="{",
)

handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
handler.setFormatter(formatter)

logger = logging.getLogger("application")
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)
