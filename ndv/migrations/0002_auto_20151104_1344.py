# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataviewitem',
            name='vizproject',
            field=models.ForeignKey(to='ndv.VizProject'),
        ),
    ]
