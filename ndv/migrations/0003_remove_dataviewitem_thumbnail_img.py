# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0002_auto_20151104_1344'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dataviewitem',
            name='thumbnail_img',
        ),
    ]
