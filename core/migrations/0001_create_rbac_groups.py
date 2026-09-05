from django.db import migrations


def create_rbac_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    groups = [
        "Admin",
        "HR Manager",
        "HR Payroll User",
        "HR Payroll Manager",
        "Employee",
    ]
    for group_name in groups:
        Group.objects.get_or_create(name=group_name)


def remove_rbac_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    groups = [
        "Admin",
        "HR Manager",
        "HR Payroll User",
        "HR Payroll Manager",
        "Employee",
    ]
    Group.objects.filter(name__in=groups).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_rbac_groups, reverse_code=remove_rbac_groups),
    ]
