# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0010_auto_20160210_1449'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataview',
            name='desc',
            field=models.TextField(),
        ),
    ]
