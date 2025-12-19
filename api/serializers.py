from rest_framework import serializers
from .models import Person, Relationships, TypeofRelationship, Family, FamilyConnection


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'name', 'surname', 'patronymic', 'gender',
                  'yearOfBirth', 'yearOfDeath', 'isAlive']


class RelationshipSerializer(serializers.ModelSerializer):
    from_person = PersonSerializer(source='fromId', read_only=True)
    to_person = PersonSerializer(source='toId', read_only=True)
    type_name = serializers.CharField(source='typeId.name', read_only=True)

    class Meta:
        model = Relationships
        fields = ['id', 'fromId', 'toId', 'typeId', 'from_person', 'to_person', 'type_name']
        extra_kwargs = {
            'fromId': {'write_only': True},
            'toId': {'write_only': True},
            'typeId': {'write_only': True}
        }


class FamilyConnectionSerializer(serializers.ModelSerializer):
    person = PersonSerializer(source='idPerson', read_only=True)

    class Meta:
        model = FamilyConnection
        fields = ['id', 'idPerson', 'idFamily', 'person']
        extra_kwargs = {
            'idPerson': {'write_only': True},
            'idFamily': {'write_only': True}
        }