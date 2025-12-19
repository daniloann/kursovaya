from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Person, Family, FamilyConnection,
    Relationships, TypeofRelationship,
    Country, Region, City
)

# ========== INLINE ФОРМЫ ==========
class FamilyConnectionInline(admin.TabularInline):
    model = FamilyConnection
    extra = 1
    fk_name = 'idPerson'


class RelationshipsInline(admin.TabularInline):
    model = Relationships
    fk_name = 'fromId'
    extra = 1
    verbose_name = "Исходящие отношения"
    verbose_name_plural = "Исходящие отношения"

# ========== ПЕРСОНЫ ==========
@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'gender_display', 'birth_year', 'is_alive_display', 'city_info')
    list_filter = ('gender', 'isAlive', 'yearOfBirth', 'idCity')
    search_fields = ('surname', 'name', 'patronymic', 'maidenName', 'idCity__name', 'fio')
    list_per_page = 25
    inlines = [FamilyConnectionInline, RelationshipsInline]

    fieldsets = (
        ('Основная информация', {
            'fields': ('surname', 'name', 'patronymic', 'maidenName', 'gender', 'yearOfBirth')
        }),
        ('Контакты', {
            'fields': ('phone', 'email', 'idCity', 'idRegion', 'idCountry')
        }),
        ('Статус', {
            'fields': ('isAlive', 'isActive', 'role', 'marriageinfo')
        }),
        ('Дополнительно', {
            'fields': ('school', 'college', 'university', 'work', 'comment'),
            'classes': ('collapse',)
        }),
    )

    def full_name(self, obj):
        return f"{obj.surname} {obj.name} {obj.patronymic or ''}".strip()

    full_name.short_description = 'ФИО'

    def gender_display(self, obj):
        return 'Мужской' if obj.gender == 1 else 'Женский'

    gender_display.short_description = 'Пол'

    def birth_year(self, obj):
        return obj.yearOfBirth or '—'

    birth_year.short_description = 'Год рождения'

    def is_alive_display(self, obj):
        color = 'green' if obj.isAlive == 1 else 'red'
        text = 'Жив(а)' if obj.isAlive == 1 else 'Умер(ла)'
        return format_html('<span style="color: {};">{}</span>', color, text)

    is_alive_display.short_description = 'Статус'

    def city_info(self, obj):
        if obj.idCity:
            return f"{obj.idCity.name} ({obj.idCountry.name if obj.idCountry else '—'})"
        return '—'

    city_info.short_description = 'Город'


# ========== ГОРОДА С ПОИСКОМ ПО СТРАНЕ/РЕГИОНУ ==========
@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'region_info', 'country_info', 'coordinates')
    list_filter = ('idRegion', 'idRegion__idCountry')
    search_fields = ('name', 'idRegion__name', 'idRegion__idCountry__name')
    list_per_page = 30

    def region_info(self, obj):
        return obj.idRegion.name if obj.idRegion else '—'

    region_info.short_description = 'Регион'

    def country_info(self, obj):
        if obj.idRegion and obj.idRegion.idCountry:
            return obj.idRegion.idCountry.name
        return '—'

    country_info.short_description = 'Страна'

    def coordinates(self, obj):
        if obj.lat and obj.lon:
            return f"{obj.lat:.4f}, {obj.lon:.4f}"
        return '—'

    coordinates.short_description = 'Координаты'


# ========== РЕГИОНЫ ==========
@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'city_count')
    list_filter = ('idCountry',)
    search_fields = ('name', 'idCountry__name')

    def country(self, obj):
        return obj.idCountry.name if obj.idCountry else '—'

    country.short_description = 'Страна'

    def city_count(self, obj):
        return obj.city_set.count()

    city_count.short_description = 'Городов'


# ========== СТРАНЫ ==========
@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'region_count', 'person_count')
    search_fields = ('name',)

    def region_count(self, obj):
        return obj.region_set.count()

    region_count.short_description = 'Регионов'

    def person_count(self, obj):
        return obj.residents.count() + obj.natives.count()

    person_count.short_description = 'Людей'


# ========== СЕМЬИ ==========
@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner_info', 'member_count')
    search_fields = ('name', 'idFamilyOwner__surname', 'idFamilyOwner__name')

    def owner_info(self, obj):
        if obj.idFamilyOwner:
            return f"{obj.idFamilyOwner.surname} {obj.idFamilyOwner.name}"
        return '—'

    owner_info.short_description = 'Владелец'

    def member_count(self, obj):
        return obj.familyconnection_set.count()

    member_count.short_description = 'Участников'


# ========== ОТНОШЕНИЯ ==========
@admin.register(Relationships)
class RelationshipsAdmin(admin.ModelAdmin):
    list_display = ('from_person', 'relation_type', 'to_person')
    list_filter = ('typeId',)
    search_fields = ('fromId__surname', 'toId__surname', 'typeId__name')

    def from_person(self, obj):
        return f"{obj.fromId.surname} {obj.fromId.name}" if obj.fromId else '—'

    from_person.short_description = 'Кто'

    def to_person(self, obj):
        return f"{obj.toId.surname} {obj.toId.name}" if obj.toId else '—'

    to_person.short_description = 'Для кого'

    def relation_type(self, obj):
        return obj.typeId.name if obj.typeId else '—'

    relation_type.short_description = 'Тип отношения'


# ========== ТИПЫ ОТНОШЕНИЙ ==========
@admin.register(TypeofRelationship)
class TypeofRelationshipAdmin(admin.ModelAdmin):
    list_display = ('name', 'relationship_count')
    search_fields = ('name',)

    def relationship_count(self, obj):
        return obj.relationships_set.count()

    relationship_count.short_description = 'Использований'


# ========== СВЯЗИ СЕМЬИ (необязательная таблица) ==========
@admin.register(FamilyConnection)
class FamilyConnectionAdmin(admin.ModelAdmin):
    list_display = ('person_info', 'family_info')
    search_fields = ('idPerson__surname', 'idFamily__name')
    list_per_page = 50

    def person_info(self, obj):
        return f"{obj.idPerson.surname} {obj.idPerson.name}" if obj.idPerson else '—'

    person_info.short_description = 'Человек'

    def family_info(self, obj):
        return obj.idFamily.name if obj.idFamily else '—'

    family_info.short_description = 'Семья'