# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0004_dataviewitem_caption'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataviewitem',
            name='resstart',
            field=models.IntegerField(default=0),
        ),
    ]
