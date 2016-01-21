# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0006_vizlayer_propagate'),
    ]

    operations = [
        migrations.AddField(
            model_name='vizlayer',
            name='tilecache_server',
            field=models.CharField(default=None, max_length=255),
        ),
    ]
