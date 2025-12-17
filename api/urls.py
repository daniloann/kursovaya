# api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('country/simple_search/', views.simple_search),
    path('family/members/', views.get_family_members),
    path('family/get_family_tree/', views.get_family_tree),
    path('person/password/', views.password_change),
    path('auth/login/', views.login_view),
    path('auth/register/', views.register_view),
    path('person/add_with_relation/', views.create_person_with_relation),
]