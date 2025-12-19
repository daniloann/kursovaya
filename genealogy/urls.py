from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),

    # Главная страница
    path('', TemplateView.as_view(template_name='index.html'), name='home'),

    # Для SPA - можно использовать path с угловыми скобками
    path('tree/', TemplateView.as_view(template_name='index.html')),
    path('search/', TemplateView.as_view(template_name='index.html')),

]

# Для статики в development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)