# api/models.py
from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'Country'

class Region(models.Model):
    name = models.CharField(max_length=255)
    idCountry = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        db_column='idCountry',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'Region'

class City(models.Model):
    name = models.CharField(max_length=255)
    idRegion = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        db_column='idRegion',
        null=True,
        blank=True
    )
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'City'

class Family(models.Model):
    name = models.CharField(max_length=255)
    idFamilyOwner = models.ForeignKey(
        'Person',
        on_delete=models.SET_NULL,
        db_column='idFamilyOwner',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'Family'

class Person(models.Model):
    name = models.CharField(max_length=255)
    patronymic = models.CharField(max_length=255, blank=True)
    surname = models.CharField(max_length=255)
    maidenName = models.CharField(max_length=255, null=True, blank=True)
    phone = models.BigIntegerField(null=True, blank=True)
    yearOfDeath = models.IntegerField(null=True, blank=True)
    monthOfDeath = models.IntegerField(null=True, blank=True)
    dayOfDeath = models.IntegerField(null=True, blank=True)
    yearOfBirth = models.IntegerField(null=True, blank=True)
    monthOfBirth = models.IntegerField(null=True, blank=True)
    dayOfBirth = models.IntegerField(null=True, blank=True)

    # Место проживания
    idCountry = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, blank=True, related_name='residents'
    )
    idCity = models.ForeignKey(
        City, on_delete=models.SET_NULL, null=True, blank=True, related_name='residents'
    )
    idRegion = models.ForeignKey(
        Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='residents'
    )

    # Место рождения
    idCountryOfBirth = models.ForeignKey(
        Country, on_delete=models.SET_NULL, null=True, blank=True, related_name='natives'
    )
    idCityOfBirth = models.ForeignKey(
        City, on_delete=models.SET_NULL, null=True, blank=True, related_name='natives'
    )
    idRegionOfBirth = models.ForeignKey(
        Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='natives'
    )

    gender = models.IntegerField()  # 0 - женский, 1 - мужской
    school = models.TextField(null=True, blank=True)
    college = models.TextField(null=True, blank=True)
    university = models.TextField(null=True, blank=True)
    work = models.TextField(null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    email = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    fio = models.CharField(max_length=255)
    age = models.IntegerField(null=True, blank=True)
    role = models.IntegerField(null=True, blank=True)
    isActive = models.IntegerField(default=1)
    isAlive = models.IntegerField(default=1)
    marriageinfo = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'Person'

class FamilyConnection(models.Model):
    idPerson = models.ForeignKey(
        Person, on_delete=models.CASCADE, db_column='idPerson', null=True, blank=True
    )
    idFamily = models.ForeignKey(
        Family, on_delete=models.CASCADE, db_column='idFamily', null=True, blank=True
    )

    class Meta:
        db_table = 'FamilyConnection'

class TypeofRelationship(models.Model):
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'TypeofRelationship'

class Relationships(models.Model):
    fromId = models.ForeignKey(
        Person, on_delete=models.CASCADE, db_column='fromId',
        null=True, blank=True, related_name='outgoing_rel'
    )
    toId = models.ForeignKey(
        Person, on_delete=models.CASCADE, db_column='toId',
        null=True, blank=True, related_name='incoming_rel'
    )
    typeId = models.ForeignKey(
        TypeofRelationship, on_delete=models.CASCADE, db_column='typeId',
        null=True, blank=True
    )

    class Meta:
        db_table = 'Relationships'