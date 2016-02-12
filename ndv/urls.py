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


from django.conf.urls import *
from django.contrib import admin
import django.contrib.auth

base_urlpatterns = patterns('ndv.views',
    # data views
    url(r'^dataview/(?P<webargs>[\w:,/-]+)', 'dataview', name='dataview'),
    url(r'^public/$', 'dataviewsPublic', name='dataviewsPublic'),
    # for redirecting queries (reqd because of same origin policy)
    url(r'^query/(?P<queryargs>[\w,./-]+)', 'query'),
    # for getting the projinfo json information from ocp
    url(r'^projinfo/(?P<queryargs>[\w,./-]+)', 'projinfo', name='projinfo'),
    # for getting the ramon json information from ocp
    url(r'^ramoninfo/(?P<webargs>[\w,./-]+)', 'ramoninfo'),
    # validate token/channel/server
    url(r'^validate/(?P<webargs>[\w,\.,/-]+)', 'validate'),
    # content for the manage modal
    url(r'^manage/viewProjects/$', 'viewProjects', name='viewProjects'),
    # manage modal
    url(r'^manage/layers/delete/$', 'deleteLayer', name='deleteLayer'),
    url(r'^manage/layers/(?P<project>[\w,-]+)/?', 'getLayers', name='getLayers'),
    url(r'^manage/deleteproject/$', 'deleteVizProject', name='deleteVizProject'),
    url(r'^manage/addproject/$', 'addVizProject', name='addVizProject'),
    url(r'^manage/editproject/submit/$', 'editVizProjectSubmit', name='editVizProjectSubmit'),
    url(r'^manage/editproject/(?P<project>[\w,-]+)/?', 'editVizProject', name='editVizProject'),
    url(r'^manage/adddataview/$', 'addDataview', name='addDataview'),
    url(r'^manage/editdataview/submit/$', 'editDataviewSubmit', name='editDataviewSubmit'),
    url(r'^manage/editdataview/(?P<token>[\w,-]+)/?', 'editDataview', name='editDataview'),
    url(r'^manage/deletedataview/$', 'deleteDataview', name='deleteDataview'),
    url(r'^manage/deletedataviewitem/$', 'deleteDataviewItem', name='deleteDataviewItem'),
    url(r'^manage/autopopulate/(?P<webargs>[\w,\.,/-]+)/?', 'autopopulateDataset', name='autopopulateDataset'),
    url(r'^manage/?$', 'manage', name='manage'),
    # user auth
    url(r'^login/$', 'processLogin', name='login'),
    url(r'^logout/$', 'processLogout', name='logout'),
    url(r'^$', 'default'),
    # for displaying ocpviz projects
    # NOTE: this must be last (because of the tokenview view)
    url(r'^project/(?P<webargs>[\w:,/-]+)$', 'projectview', name='projectview'),
    url(r'(?P<webargs>[\w:,/-]+)$', 'tokenview', name='tokenview'),
)

urlpatterns = patterns('',
  url(r'^admin/', include(admin.site.urls)),
  url('^ndv/', include(base_urlpatterns)),
  url('^', include(base_urlpatterns)), # maintain unprefixed URLs
)
