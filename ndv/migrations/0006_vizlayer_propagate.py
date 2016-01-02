# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0005_dataviewitem_resstart'),
    ]

    operations = [
        migrations.AddField(
            model_name='vizlayer',
            name='propagate',
            field=models.IntegerField(default=0),
        ),
    ]
