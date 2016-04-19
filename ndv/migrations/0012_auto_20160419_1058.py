# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ndv', '0011_auto_20160211_2223'),
    ]

    operations = [
        migrations.AddField(
            model_name='vizproject',
            name='blendmode',
            field=models.CharField(default=b'normal', max_length=255, choices=[(b'normal', b'Normal'), (b'additive', b'Additive'), (b'subtractive', b'Subtractive'), (b'multiply', b'Multiply'), (b'none', b'None')]),
        ),
        migrations.AlterField(
            model_name='vizlayer',
            name='server',
            field=models.CharField(default=b'localhost', max_length=255, choices=[(b'openconnecto.me', b'openconnecto.me'), (b'brainviz1.cs.jhu.edu', b'brainviz1'), (b'braingraph1.cs.jhu.edu', b'braingraph1'), (b'braingraph1dev.cs.jhu.edu', b'braingraph1dev'), (b'braingraph2.cs.jhu.edu', b'braingraph2'), (b'dsp061.pha.jhu.edu', b'dsp061'), (b'dsp062.pha.jhu.edu', b'dsp062'), (b'dsp063.pha.jhu.edu', b'dsp063'), (b'localhost', b'debug (localhost)')]),
        ),
    ]
