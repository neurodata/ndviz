# Copyright 2016 NeuroData (http://neurodata.io)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Designed, Developed, and Maintained by Alex Baden
# abaden1@jhu.edu
# github.com/alexbaden

from django.contrib import admin

# Register your models here.

from django.contrib import admin
from models import VizProject
from models import VizLayer
from models import DataViewItem
from models import DataView

# Dataviews
class DataViewItemInline(admin.TabularInline):
  model = DataView.items.through
  extra = 2

class DataViewAdmin(admin.ModelAdmin):
  list_display = ('name', 'desc', 'token', 'public')
  exclude = ('items',)
  inlines = [
      DataViewItemInline,
  ]

admin.site.register(DataView, DataViewAdmin)

class DataViewItemAdmin(admin.ModelAdmin):
  list_display = ('name', 'vizproject')

admin.site.register(DataViewItem, DataViewItemAdmin)

# Viz Projects
class VizLayerInline(admin.TabularInline):
  model = VizProject.layers.through
  extra = 1

class VizProjectAdmin(admin.ModelAdmin):
  list_display = ('project_name', 'project_description', 'public')
  exclude = ('layers',)
  inlines = [
      VizLayerInline,
  ]

admin.site.register(VizProject, VizProjectAdmin)

class VizLayerAdmin(admin.ModelAdmin):
  list_display = ('layer_name', 'token', 'channel')

admin.site.register(VizLayer, VizLayerAdmin)
