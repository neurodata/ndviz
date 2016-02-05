# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0008_auto_20160126_1720'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vizlayer',
            name='tilecache_server',
            field=models.CharField(default=None, max_length=255, null=True, blank=True),
        ),
    ]
