# api/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from .models import (
    Country, Region, City, Person, Family,
    FamilyConnection, Relationships, TypeofRelationship
)

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
        for p in persons[:1]:
            result.append({
                'id': p.id,
                'name': p.name,
                'surname': p.surname,
                'gender': p.gender,
                'yearOfBirth': p.yearOfBirth,
            })
        return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500, json_dumps_params={'ensure_ascii': False})

# === ПОЛУЧЕНИЕ ЧЛЕНОВ СЕМЬИ ===
@csrf_exempt
@require_http_methods(["POST"])
def get_family_members(request):
    try:
        data = json.loads(request.body)
        family_id = data.get('family_id')
        if not family_id:
            return JsonResponse({'error': 'family_id required'}, status=400)
        connections = FamilyConnection.objects.filter(idFamily=family_id).select_related('idPerson')
        members = []
        for conn in connections:
            p = conn.idPerson
            members.append({
                'id': p.id,
                'fio': p.fio or f"{p.surname} {p.name}"
            })
        return JsonResponse(members, safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500, json_dumps_params={'ensure_ascii': False})

# === ГЕНЕАЛОГИЧЕСКОЕ ДЕРЕВО (без рекурсии) ===
@csrf_exempt
@require_http_methods(["POST"])
def get_family_tree(request):
    try:
        data = json.loads(request.body)
        person_id = int(data.get('idPerson'))
        person = get_object_or_404(Person, id=person_id)
        def s(p): return {
            'idPerson': p.id,
            'name': p.name or "",
            'surname': p.surname or "",
            'gender': p.gender or 0,
            'yearOfBirth': p.yearOfBirth or 0,
            'yearOfDeath': p.yearOfDeath or 0,
        }
        tree = s(person)
        tree.update({'father': None, 'mother': None, 'son': [], 'daughter': [], 'husband': [], 'wife': []})
        parent_rels = Relationships.objects.filter(fromId=person_id, typeId__name__in=['father', 'mother'])
        for rel in parent_rels:
            p = rel.toId
            if rel.typeId.name == 'father': tree['father'] = s(p)
            elif rel.typeId.name == 'mother': tree['mother'] = s(p)
        child_spouse_rels = Relationships.objects.filter(fromId=person_id, typeId__name__in=['son', 'daughter', 'husband', 'wife'])
        for rel in child_spouse_rels:
            p = rel.toId
            t = rel.typeId.name
            if t == 'son': tree['son'].append(s(p))
            elif t == 'daughter': tree['daughter'].append(s(p))
            elif t == 'husband': tree['husband'].append(s(p))
            elif t == 'wife': tree['wife'].append(s(p))
        return JsonResponse(tree, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500, json_dumps_params={'ensure_ascii': False})

# === СМЕНА ПАРОЛЯ БЕЗ EMAIL ===
# Замените функцию password_change на:
@csrf_exempt
@require_http_methods(["POST"])
def password_change(request):
    try:
        data = json.loads(request.body)
        id_person = data.get('idPerson')
        current_password = data.get('password')
        new_password = data.get('new_password')
        if not all([id_person, current_password, new_password]):
            return JsonResponse({'error': 'All fields are required'}, status=400)
        person = get_object_or_404(Person, id=id_person)
        if person.password != current_password:
            return JsonResponse({'error': 'Incorrect password'}, status=400)
        person.password = new_password
        person.save()
        return JsonResponse('Пароль успешно изменён', safe=False, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500, json_dumps_params={'ensure_ascii': False})

# === АВТОРИЗАЦИЯ ===
@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return JsonResponse({'success': False, 'error': 'Email and password required'}, status=400)
        person = Person.objects.get(email=email, password=password, isActive=1)
        family_id = None
        if person.familyconnection_set.exists():
            family_id = person.familyconnection_set.first().idFamily.id
        return JsonResponse({
            'success': True,
            'id': person.id,
            'name': person.name,
            'email': person.email,
            'family_id': family_id,
            'token': f'token_{person.id}_{person.email}'
        }, json_dumps_params={'ensure_ascii': False})
    except Person.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Неверный email или пароль'}, status=401)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500, json_dumps_params={'ensure_ascii': False})

@csrf_exempt
@require_http_methods(["POST"])
def register_view(request):
    try:
        data = json.loads(request.body)
        person = Person.objects.create(
            name=data['name'],
            surname=data['surname'],
            email=data['email'],
            password=data['password'],
            fio=f"{data['name']} {data['surname']}",
            gender=int(data.get('gender', 0)),
            role=1,
            isActive=1,
            isAlive=1
        )
        family = Family.objects.create(name=f"Семья {data['surname']}", idFamilyOwner=person)
        FamilyConnection.objects.create(idPerson=person, idFamily=family)
        return JsonResponse({
            'success': True,
            'id': person.id,
            'family_id': family.id
        }, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500, json_dumps_params={'ensure_ascii': False})

# === ДОБАВЛЕНИЕ РОДСТВЕННИКА ===
@csrf_exempt
@require_http_methods(["POST"])
def create_person_with_relation(request):
    try:
        data = json.loads(request.body)
        required = ['name', 'surname', 'gender', 'idFamily', 'basePersonId', 'relationType']
        for key in required:
            if key not in data:
                return JsonResponse({'success': False, 'error': f'Missing {key}'}, status=400)
        person = Person.objects.create(
            name=data.get('name', ''),
            surname=data.get('surname', ''),
            fio=f"{data.get('surname','')} {data.get('name','')}".strip(),
            gender=int(data.get('gender', 0)),
            yearOfBirth=data.get('yearOfBirth'),
            isActive=1,
            isAlive=1
        )
        family_id = int(data['idFamily'])
        FamilyConnection.objects.create(idPerson=person, idFamily_id=family_id)
        rel_type_obj = get_object_or_404(TypeofRelationship, name=data['relationType'])
        base_id = int(data['basePersonId'])
        if data['relationType'] in ('son', 'daughter'):
            from_id, to_id = base_id, person.id
        else:
            from_id, to_id = person.id, base_id
        Relationships.objects.create(fromId_id=from_id, toId_id=to_id, typeId=rel_type_obj)
        return JsonResponse({'success': True, 'personId': person.id}, json_dumps_params={'ensure_ascii': False})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500, json_dumps_params={'ensure_ascii': False})