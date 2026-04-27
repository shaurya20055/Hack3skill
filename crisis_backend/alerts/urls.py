from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    PropertyViewSet, AlertViewSet, RegisterView,
    AIChatView, AnalyticsView, StaffManageView, ClassifyTextView
)

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'alerts', AlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('ai-chat/', AIChatView.as_view(), name='ai_chat'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('staff/', StaffManageView.as_view(), name='staff_manage'),
    path('classify/', ClassifyTextView.as_view(), name='classify_text'),
]
