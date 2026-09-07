from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("hospitals", "0002_hospital_staff_fields"),
        ("provinces", "0002_province_admin_state"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[migrations.DeleteModel(name="ProvinceAdmin")],
            database_operations=[],
        ),
        migrations.RenameIndex(
            model_name="hospitaladmin",
            new_name="hospital_ad_staff_t_66f648_idx",
            old_name="hospital_ad_staff_t_idx",
        ),
    ]
