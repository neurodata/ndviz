# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0003_remove_dataviewitem_thumbnail_img'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataviewitem',
            name='caption',
            field=models.CharField(default='a test caption', max_length=255, verbose_name=b'A caption for this dataview item (to be displayed publically'),
            preserve_default=False,
        ),
    ]
