import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'genealogy.settings')
django.setup()

from api.models import TypeofRelationship

# Список типов отношений
types = ['father', 'mother', 'son', 'daughter', 'husband', 'wife']

print("Создаю типы отношений...")
for t in types:
    obj, created = TypeofRelationship.objects.get_or_create(name=t)
    if created:
        print(f"✅ Создан: {t}")
    else:
        print(f"📋 Уже существует: {t}")

print("Готово!")