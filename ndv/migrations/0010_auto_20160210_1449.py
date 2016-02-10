# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0009_auto_20160204_1056'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataviewitem',
            name='caption',
            field=models.CharField(max_length=255, verbose_name=b'A caption for this dataview item (to be displayed publically', blank=True),
        ),
        migrations.AlterField(
            model_name='dataviewitem',
            name='desc_int',
            field=models.CharField(max_length=255, verbose_name=b'An internal description for this item. The external description will be the project description.', blank=True),
        ),
    ]
