from django.urls import path
from . import views




urlpatterns = [
    # Основные функции
    path('', views.home, name='home'),
    path('country/simple_search/', views.simple_search),
    path('person/save/', views.save_person),
    path('relationship/save/', views.save_relationship),
    path('person/all/', views.get_all_people),
    path('tree/build/<int:person_id>/', views.build_tree, name='build_tree'),
    # Географические данные
    path('geo/countries/', views.get_countries, name='get_countries'),
    path('geo/regions/', views.get_regions, name='get_regions'),
    path('geo/cities/', views.get_cities, name='get_cities'),
    path('geo/search_cities/', views.search_cities, name='search_cities'),
]