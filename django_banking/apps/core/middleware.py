class AuditLoggingMiddleware:
    """Middleware capturing request context for logging purposes."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response
