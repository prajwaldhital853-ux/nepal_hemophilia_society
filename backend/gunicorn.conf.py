"""Gunicorn production settings for the NHMS Django API."""

import os

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = 3
worker_class = "gthread"
threads = 4
timeout = 120
graceful_timeout = 30
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
