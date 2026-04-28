import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crisis_backend.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing consumers that reference ORM models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import alerts.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            alerts.routing.websocket_urlpatterns
        )
    ),
})
