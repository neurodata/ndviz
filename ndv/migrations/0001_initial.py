# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DataView',
            fields=[
                ('name', models.CharField(max_length=255, serialize=False, verbose_name=b'Long name for this data view.', primary_key=True)),
                ('desc', models.CharField(max_length=255)),
                ('token', models.CharField(max_length=255, verbose_name=b'The identifier / access name for this dataview (appears in ocp/ocpviz/dataview/<<token>>/)')),
                ('public', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='DataViewItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=255, verbose_name=b'An item attached to a particular dataview.')),
                ('desc_int', models.CharField(max_length=255, verbose_name=b'An internal description for this item. The external description will be the project description.')),
                ('xstart', models.IntegerField(default=0)),
                ('ystart', models.IntegerField(default=0)),
                ('zstart', models.IntegerField(default=0)),
                ('marker_start', models.BooleanField(default=False)),
                ('thumbnail_img', models.ImageField(upload_to=b'ocpviz/thumbnails/')),
                ('thumbnail_url', models.CharField(default=b'', max_length=255)),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='VizLayer',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('layer_name', models.CharField(max_length=255)),
                ('layer_description', models.CharField(max_length=255)),
                ('server', models.CharField(default=b'localhost', max_length=255, choices=[(b'localhost', b'localhost'), (b'brainviz1.cs.jhu.edu', b'brainviz1'), (b'openconnecto.me', b'openconnecto.me'), (b'braingraph1.cs.jhu.edu', b'braingraph1'), (b'braingraph1dev.cs.jhu.edu', b'braingraph1dev'), (b'braingraph2.cs.jhu.edu', b'braingraph2'), (b'dsp061.pha.jhu.edu', b'dsp061'), (b'dsp062.pha.jhu.edu', b'dsp062'), (b'dsp063.pha.jhu.edu', b'dsp063')])),
                ('layertype', models.CharField(max_length=255, choices=[(b'image', b'IMAGES'), (b'annotation', b'ANNOTATIONS'), (b'probmap', b'PROBABILITY_MAP'), (b'rgb', b'RGB'), (b'timeseries', b'TIMESERIES')])),
                ('token', models.CharField(max_length=255)),
                ('channel', models.CharField(max_length=255)),
                ('tilecache', models.BooleanField(default=False)),
                ('color', models.CharField(blank=True, max_length=255, choices=[(b'C', b'cyan'), (b'M', b'magenta'), (b'Y', b'yellow'), (b'R', b'red'), (b'G', b'green'), (b'B', b'blue')])),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='VizProject',
            fields=[
                ('project_name', models.CharField(max_length=255, serialize=False, verbose_name=b'Name for this visualization project.', primary_key=True)),
                ('project_description', models.CharField(max_length=4096, blank=True)),
                ('public', models.IntegerField(default=0, choices=[(1, b'Yes'), (0, b'No')])),
                ('xoffset', models.IntegerField(default=0)),
                ('ximagesize', models.IntegerField()),
                ('yoffset', models.IntegerField(default=0)),
                ('yimagesize', models.IntegerField()),
                ('zoffset', models.IntegerField(default=0)),
                ('zimagesize', models.IntegerField()),
                ('starttime', models.IntegerField(default=0)),
                ('endtime', models.IntegerField(default=0)),
                ('minres', models.IntegerField(default=0)),
                ('scalinglevels', models.IntegerField()),
                ('layers', models.ManyToManyField(related_name='project', to='ndv.VizLayer')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL, blank=True)),
            ],
        ),
        migrations.AddField(
            model_name='dataviewitem',
            name='vizproject',
            field=models.ForeignKey(to='ndv.VizLayer'),
        ),
        migrations.AddField(
            model_name='dataview',
            name='items',
            field=models.ManyToManyField(related_name='dataview', to='ndv.DataViewItem'),
        ),
        migrations.AddField(
            model_name='dataview',
            name='user',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL, blank=True),
        ),
    ]
