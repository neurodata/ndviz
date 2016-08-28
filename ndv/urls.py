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


from django.conf.urls import include, url
from django.conf import settings
from django.conf.urls.static import static

from django.contrib import admin
admin.autodiscover()

from . import views

base_urlpatterns = [
    # tools
    url(r'^tools/', include('tools.urls')),
    # data views
    url(r'^dataview/render/(?P<webargs>[\w:,/-]+)', views.renderDataview, name='renderDataview'),
    url(r'^dataview/(?P<webargs>[\w:,/-]+)', views.dataview, name='dataview'),
    url(r'^list_public/$', views.listPublic, name='listPublic'),
    url(r'^public/$', views.dataviewsPublic, name='dataviewsPublic'),
    # for redirecting queries (reqd because of same origin policy)
    url(r'^query/(?P<queryargs>[\w,./-]+)', views.query),
    # for getting the ramon json information from ocp
    url(r'^ramoninfo/(?P<webargs>[\w,./-]+)', views.ramoninfo),
    # content for the manage modal
    url(r'^manage/viewProjects/$', views.viewProjects, name='viewProjects'),
    # manage modal
    url(r'^manage/layers/delete/$', views.deleteLayer, name='deleteLayer'),
    url(r'^manage/layers/(?P<project>[\w,-]+)/?', views.getLayers, name='getLayers'),
    url(r'^manage/deleteproject/$', views.deleteVizProject, name='deleteVizProject'),
    url(r'^manage/addproject/$', views.addVizProject, name='addVizProject'),
    url(r'^manage/editproject/submit/$', views.editVizProjectSubmit, name='editVizProjectSubmit'),
    url(r'^manage/editproject/(?P<project>[\w,-]+)/?', views.editVizProject, name='editVizProject'),
    url(r'^manage/adddataview/$', views.addDataview, name='addDataview'),
    url(r'^manage/editdataview/submit/$', views.editDataviewSubmit, name='editDataviewSubmit'),
    url(r'^manage/editdataview/(?P<token>[\w,-]+)/?', views.editDataview, name='editDataview'),
    url(r'^manage/deletedataview/$', views.deleteDataview, name='deleteDataview'),
    url(r'^manage/deletedataviewitem/$', views.deleteDataviewItem, name='deleteDataviewItem'),
    url(r'^manage/autopopulate/(?P<webargs>[\w,\.,/-]+)/?', views.autopopulateDataset, name='autopopulateDataset'),
    url(r'^manage/?$', views.manage, name='manage'),
    # user auth
    url(r'^login/$', views.processLogin, name='login'),
    url(r'^logout/$', views.processLogout, name='logout'),
    url(r'^$', views.default),
    # for displaying ocpviz projects
    # NOTE: this must be last (because of the tokenview view)
    url(r'^project/(?P<webargs>[\w:,/-]+)$', views.projectview, name='projectview'),
    url(r'(?P<webargs>[\w:,/-]+)$', views.tokenview, name='tokenview'),
]

urlpatterns = [
  url(r'^admin/', include(admin.site.urls)),
  url('^ndv/', include(base_urlpatterns)),
  url('^', include(base_urlpatterns)), # maintain unprefixed URLs
]
