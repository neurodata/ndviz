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

from django.shortcuts import render

from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseNotFound

import json
import re

def synaptogram(request, webargs):
    # parse webargs
    # /ndv/tools/synaptogram/server/token/channel/res/x,xwidth/y,width/z,zwidth/
    supported_webargs = 'synaptogram/server/token/channel/res/x,xwidth/y,width/z,zwidth/'

    try:
        m = re.match(r"(?P<server>[\w.$\-_]+)/(?P<token>\w+)/?(?P<channels>[\w,_]+)?/?(?P<res>[\d\-]+)?/?(?P<xargs>[\d,]+)?/?(?P<yargs>[\d,]+)?/?(?P<zargs>[\d,]+)?/?$", webargs)
        md = m.groupdict()
        server = md['server']
        token = md['token']
        chanstr = md['channels']

        if md['res']: # if res is included, we need xyz and bounding box dims
            res = int(md['res'])
            (x, xsize) = [int(i) for i in md['xargs'].split(',')]
            (y, ysize) = [int(i) for i in md['yargs'].split(',')]
            (z, zsize) = [int(i) for i in md['zargs'].split(',')]
        else:
            res = 0
            (x, xsize) = (0, 5)
            (y, ysize) = (0, 5)
            (z, zsize) = (0, 5)

    except Exception, e:
        print e
        return HttpResponseBadRequest("[ERROR]: Invalid RESTful argument: {} (format: {})".format( webargs, supported_webargs ))

    if len(server.split('$')) > 1:
        # add suffix to server (currently only ONE suffix supported)
        server = "{}/{}".format(server.split('$')[0], server.split('$')[1])

    if chanstr:
        channels = chanstr.split(',')
    else:
        channels = None

    # scale up the xy res if < 0
    while res < 0:
        res += 1
        x = int(x / 2)
        y = int(y / 2)

    context = {
        'server': server,
        'token': token,
        'channels': channels,
        'res': res,
        'x': x,
        'xsize': xsize,
        'y': y,
        'ysize': ysize,
        'z': z,
        'zsize': zsize,
    }
    return render(request, 'tools/synaptogram.html', context)

def default(request):
    return HttpResponse()
