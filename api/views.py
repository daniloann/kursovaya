import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from .models import (
    Country, Region, City, Person, Relationships, TypeofRelationship
)
from .serializers import PersonSerializer
from django.db import transaction

# === ПРОСТОЙ ПОИСК ===
@csrf_exempt
@require_http_methods(["POST"])
def simple_search(request):
    try:
        data = json.loads(request.body)
        persons = Person.objects.all()

        if 'surname' in data:
            persons = persons.filter(surname__icontains=data['surname'])
        if 'gender' in data:
            persons = persons.filter(gender=data['gender'])
        if 'yearOfBirth' in data and 'ageTolerance' in data:
            year = data['yearOfBirth']
            tol = data['ageTolerance']
            persons = persons.filter(yearOfBirth__gte=year - tol, yearOfBirth__lte=year + tol)

        result = []
        # УБРАТЬ [:1] - возвращать ВСЕХ найденных
        for p in persons:  # <-- ИЗМЕНИТЬ ТУТ
            result.append({
                'id': p.id,
                'name': p.name,
                'surname': p.surname,
                'gender': p.gender,
                'yearOfBirth': p.yearOfBirth,
            })

        return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def save_person(request):
    try:
        data = json.loads(request.body)

        # Получаем город из данных
        city_name = data.get('city', '').strip()
        city = None

        # Если город указан, ищем или создаем
        if city_name:
            # Ищем город в базе
            city = City.objects.filter(name__iexact=city_name).first()

            # Если города нет - создаем новый
            if not city:
                # Создаем страну "Неизвестно" если нужно
                default_country, _ = Country.objects.get_or_create(name="Неизвестно")
                default_region, _ = Region.objects.get_or_create(name="Неизвестно", idCountry=default_country)

                city = City.objects.create(
                    name=city_name,
                    idRegion=default_region
                )

        # Создаем человека
        person = Person.objects.create(
            name=data['name'],
            surname=data['surname'],
            gender=int(data['gender']),
            yearOfBirth=data.get('yearOfBirth'),
            isAlive=data.get('isAlive', 1),
            fio=f"{data['surname']} {data['name']}",
            idCity=city  # Сохраняем город
        )

        return JsonResponse({
            'success': True,
            'message': 'Человек сохранен в базу данных',
            'personId': person.id,
            'city': city.name if city else None
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

# === СОХРАНЕНИЕ ОТНОШЕНИЙ В БАЗУ ===
@csrf_exempt
@require_http_methods(["POST"])
def save_relationship(request):
    try:
        data = json.loads(request.body)

        with transaction.atomic():
            # Получаем объекты
            from_person = Person.objects.get(id=data['fromId'])
            to_person = Person.objects.get(id=data['toId'])
            rel_type = TypeofRelationship.objects.get(name=data['relationType'])

            # Проверяем, не существует ли уже такое отношение
            existing = Relationships.objects.filter(
                fromId=from_person,
                toId=to_person,
                typeId=rel_type
            ).exists()

            if existing:
                return JsonResponse({
                    'success': True,
                    'message': 'Отношение уже существует'
                })

            # Создаем отношение
            relationship = Relationships.objects.create(
                fromId=from_person,
                toId=to_person,
                typeId=rel_type
            )

            # Если это родительское отношение, автоматически создаем обратное
            if data['relationType'] in ['father', 'mother']:
                child_type = TypeofRelationship.objects.get(
                    name='son' if to_person.gender == 1 else 'daughter'
                )
                Relationships.objects.create(
                    fromId=to_person,
                    toId=from_person,
                    typeId=child_type
                )

            return JsonResponse({
                'success': True,
                'message': 'Отношение сохранено в базу данных',
                'relationshipId': relationship.id
            })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# === ПОЛУЧЕНИЕ ВСЕХ ЛЮДЕЙ ===
@csrf_exempt
@require_http_methods(["GET"])
def get_all_people(request):
    try:
        people = Person.objects.all().order_by('surname', 'name')
        serializer = PersonSerializer(people, many=True)
        return JsonResponse(serializer.data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def build_tree(request, person_id):
    try:
        def get_person_tree(person_id, depth=0, max_depth=4):
            if depth > max_depth:
                return None

            person = get_object_or_404(Person, id=person_id)

            # Базовая информация о человеке
            person_data = {
                'id': person.id,
                'name': person.name,
                'surname': person.surname,
                'gender': person.gender,
                'yearOfBirth': person.yearOfBirth,
                'yearOfDeath': person.yearOfDeath,
                'isAlive': person.isAlive,
                'role': 'self' if depth == 0 else 'relative',
                'depth': depth,
                'parents': [],
                'children': [],
                'spouses': []
            }

            # Находим родителей
            parent_rels = Relationships.objects.filter(
                toId=person_id,
                typeId__name__in=['father', 'mother']
            ).select_related('fromId', 'typeId')

            for rel in parent_rels:
                parent_tree = get_person_tree(rel.fromId.id, depth + 1, max_depth)
                if parent_tree:
                    parent_tree['relation'] = rel.typeId.name
                    person_data['parents'].append(parent_tree)

            # Находим детей
            child_rels = Relationships.objects.filter(
                fromId=person_id,
                typeId__name__in=['son', 'daughter']
            ).select_related('toId', 'typeId')

            for rel in child_rels:
                child_tree = get_person_tree(rel.toId.id, depth + 1, max_depth)
                if child_tree:
                    child_tree['relation'] = rel.typeId.name
                    person_data['children'].append(child_tree)

            # Находим супругов
            spouse_rels = Relationships.objects.filter(
                fromId=person_id,
                typeId__name__in=['husband', 'wife']
            ).select_related('toId', 'typeId')

            for rel in spouse_rels:
                spouse_tree = get_person_tree(rel.toId.id, depth, max_depth)
                if spouse_tree:
                    spouse_tree['relation'] = rel.typeId.name
                    person_data['spouses'].append(spouse_tree)

            return person_data

        tree = get_person_tree(person_id)
        return JsonResponse(tree, json_dumps_params={'ensure_ascii': False})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_countries(request):
    """Получить список всех стран"""
    countries = Country.objects.all().order_by('name')
    result = [{'id': c.id, 'name': c.name} for c in countries]
    return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False})


@csrf_exempt
@require_http_methods(["POST"])
def get_regions(request):
    """Получить регионы по стране"""
    try:
        data = json.loads(request.body)
        country_id = data.get('countryId')

        if not country_id:
            return JsonResponse([], safe=False)

        regions = Region.objects.filter(idCountry_id=int(country_id)).order_by('name')
        result = [{'id': r.id, 'name': r.name} for r in regions]
        return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def get_cities(request):
    """Получить города по региону"""
    try:
        data = json.loads(request.body)
        region_id = data.get('regionId')

        if not region_id:
            return JsonResponse([], safe=False)

        cities = City.objects.filter(idRegion_id=int(region_id)).order_by('name')
        result = [{'id': c.id, 'name': c.name, 'lat': c.lat, 'lon': c.lon} for c in cities]
        return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def search_cities(request):
    """Поиск городов по названию"""
    query = request.GET.get('q', '').strip()

    if not query or len(query) < 2:
        return JsonResponse([], safe=False)

    cities = City.objects.filter(name__icontains=query).order_by('name')[:20]
    result = []

    for city in cities:
        result.append({
            'id': city.id,
            'name': city.name,
            'region': city.idRegion.name if city.idRegion else '',
            'country': city.idRegion.idCountry.name if city.idRegion and city.idRegion.idCountry else '',
            'full_name': f"{city.name}, {city.idRegion.name if city.idRegion else ''}, {city.idRegion.idCountry.name if city.idRegion and city.idRegion.idCountry else ''}"
        })

    return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False})