from django.db import migrations


def migrate_expired_to_running(apps, schema_editor):
    Contract = apps.get_model('contracts', 'Contract')
    Contract.objects.filter(state='expired').update(state='running')


def reverse_func(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('contracts', '0002_alter_contract_state'),
    ]

    operations = [
        migrations.RunPython(migrate_expired_to_running, reverse_code=reverse_func),
    ]
