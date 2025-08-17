from django.urls import path
from .views import RegisterView, LoginView, LogoutView, MeView, CookieTokenRefreshView
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    # The logout view is custom and handles token blacklisting
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me')
]