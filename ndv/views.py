# Copyright 2015 Open Connectome Project (http://openconnecto.me)
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

from django.shortcuts import render
from django.shortcuts import redirect
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseNotFound

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

from django.template import RequestContext
#from django.contrib.sites.models import Site

from django.conf import settings

from models import VizProject
from models import VizLayer
from models import DataView
from models import DataViewItem

import urllib2
import json
import re

VERSION = 'v0.4 beta'

VALID_SERVERS = {
    'localhost':'localhost',
    'dsp061':'dsp061.pha.jhu.edu',
    'dsp062':'dsp062.pha.jhu.edu',
    'dsp063':'dsp063.pha.jhu.edu',
    'openconnecto.me':'openconnecto.me',
    'braingraph1':'braingraph1.cs.jhu.edu',
    'braingraph1dev':'braingraph1dev.cs.jhu.edu',
    'braingraph2':'braingraph2.cs.jhu.edu',
    'brainviz1':'brainviz1.cs.jhu.edu',
    }

QUERY_TYPES = ['ANNOS']

def default(request):
  context = {
      'layers': None,
      'project_name': None,
      'xsize': 0,
      'ysize': 0,
      'zsize': 0,
      'xoffset': 0,
      'yoffset': 0,
      'zoffset': 0,
      'res': 0,
      'xdownmax': 0,
      'ydownmax': 0,
      'starttime': 0,
      'endtime': 0,
      'maxres': 0,
      'minres':0,
      'xstart': 0,
      'ystart': 0,
      'zstart': 0,
      'plane': 'xy',
      'marker': 0,
      'timeseries': False,
      'version': VERSION,
      }
  return render(request, 'ndv/viewer.html', context)

# View a project dynamically generated based on token (and channel)
def tokenview(request, webargs):
  """ /<<token>>/<<channel1,channel2,...>>/<<plane>>(opt)/<<res>/<<x>>/<<y>>/<<z>>/<<options>>/ """
  # res (x,y,z) will center the map at (x,y,z) for a given res
  channels_str = None
  channels = None
  channel_colors = {}

  # initialize these variables, which will be passed to the template
  x = None
  y = None
  z = None
  res = None
  marker = False

  options = None

  # process arguments
  try:
    m = re.match(r"(?P<token>\w+)/?(?!(xy|xz|yz))(?P<channels>[\w,]+)?/?(?P<plane>xy|xz|yz)?/(?P<cutout>[\d,/-]+)?/?(?P<options>[\w:,{}]+)?/?$", webargs)
    [token_str, neg, channels_str, orientation, cutoutstr, options_str] = [i for i in m.groups()]

    if channels_str is not None:
      channels_str = channels_str.split(',')

    if options_str is not None:
      options = {}
      options_raw = options_str.split(',')
      for option in options_raw:
        if len(option.split(':')) > 1:
          options[ option.split(':')[0] ] = option.split(':')[1]
        else:
          options[option] = True

  except Exception, e:
    print e
    return HttpResponseBadRequest("[ERROR]: Invalid RESTful argument.")

  # process cutoutargs
  if cutoutstr is not None:
    cutoutargs = cutoutstr.split('/')

    if len (cutoutstr) >= 4:
      res = int(cutoutargs[0])
      x = int(cutoutargs[1])
      y = int(cutoutargs[2])
      z = int(cutoutargs[3])

  # get data from ocp running locally
  # make get request to projinfo

  if settings.OCP_SERVER is None:
    addr = 'http://' + request.META['HTTP_HOST'] + '/ocp/ca/' + token_str + '/info/'
  else:
    addr = 'http://' + settings.OCP_SERVER + '/ocp/ca/' + token_str + '/info/'

  try:
    r = urllib2.urlopen(addr)
  except urllib2.HTTPError, e:
    if e.getcode() == 404:
      r = '[ERROR]: Token {} does not exist!'.format(token_str)
      return HttpResponseNotFound(r)
    elif e.getcode() == 500:
      r = '[ERROR]: The remote OCP server encountered a problem. (error code: {})'.format( e.getcode() )
      return HttpResponseBadRequest(r)
    else:
      r = '[ERROR]: Unknown error. (error code: {})'.format( e.getcode() )
      return HttpResponseBadRequest(r)

  jsoninfo = json.loads(r.read())

  # get project metadata
  project_name = jsoninfo['project']['name']
  project_description = jsoninfo['project']['description']

  # get dataset metadata
  ximagesize = jsoninfo['dataset']['imagesize']['0'][0]
  yimagesize = jsoninfo['dataset']['imagesize']['0'][1]
  zimagesize = jsoninfo['dataset']['imagesize']['0'][2]

  xoffset = jsoninfo['dataset']['offset']['0'][0]
  yoffset = jsoninfo['dataset']['offset']['0'][1]
  zoffset = jsoninfo['dataset']['offset']['0'][2]

  scalinglevels = jsoninfo['dataset']['scalinglevels']

  starttime = jsoninfo['dataset']['timerange'][0]
  endtime = jsoninfo['dataset']['timerange'][1]

  # read in all channel info first
  channel_info = {}
  for channel in jsoninfo['channels'].keys():
    channel_info[channel] = {}
    channel_info[channel]['channel_name'] = channel
    channel_info[channel]['channel_type'] = jsoninfo['channels'][channel]['channel_type']

  # add channels to dict
  channels = []
  if (channels_str is not None) and (len(channels_str[0]) > 0):
    for channel_str in channels_str:
      if len(channel_str) > 0:
        if len(channel_str.split(':')) > 1:
          if ( channel_str.split(':')[0] not in jsoninfo['channels'].keys() ):
            return HttpResponseNotFound("[Error]: Could not find channel {} for token {}.".format(channel_str, project_name))
          else:
            channel_colors[channel_str.split(':')[0]] = channel_str.split(':')[1]
            channels.append( channel_info[ channel_str.split(':')[0] ] )
        else:
          if ( channel_str not in jsoninfo['channels'].keys() ):
            return HttpResponseNotFound("[Error]: Could not find channel {} for token {}.".format(channel_str, project_name))
          else:
            channels.append( channel_info[ channel_str ] )
  else:
    # get all channels for projects
    for channel in channel_info.keys():
      channels.append( channel_info[channel] )


  layers = []
  timeseries = False # should we display timeseries controls?
  # we convert the channels to layers here
  """
  # AB Note: I decided it would be better to get all channels than just the default
  # channel. But it is up for discussion.
  if channels is None:
    # assume default channel, single layer called by the token
    # get the default channel and add it to channels
    channel = get_object_or_404(Channel, project=token.project, default=True)
    channels.append(channel)
  """
  # convert all channels to layers
  for channel in channels:
    tmp_layer = VizLayer()
    tmp_layer.layer_name = channel['channel_name']
    tmp_layer.layer_description = project_description
    if channel['channel_type'] == 'timeseries':
      timeseries = True
    tmp_layer.layertype = channel['channel_type']
    tmp_layer.token = project_name
    tmp_layer.channel = channel['channel_name']
    if settings.OCP_SERVER is None:
      tmp_layer.server = request.META['HTTP_HOST'];
    else:
      tmp_layer.server = settings.OCP_SERVER
    tmp_layer.tilecache = False
    if channel['channel_name'] in channel_colors.keys():
      tmp_layer.color = channel_colors[ channel['channel_name'] ].upper()
    layers.append(tmp_layer)

  # package data for the template
  xdownmax = (ximagesize + xoffset - 1)/(2**scalinglevels)
  ydownmax = (yimagesize + yoffset - 1)/(2**scalinglevels)
  # center the map on the image, if no other coordinate is specified
  if x is None:
    x = xdownmax/2
  if y is None:
    y = ydownmax/2
  if z is None:
    z = zoffset
  if res is None:
    res = scalinglevels

  # process template options
  blendmode = 'normal'
  if options is not None:
    if 'marker' in options.keys():
      marker = True
    if 'blend' in options.keys():
      blendmode = options['blend'] # TODO should we validate this?

  context = {
      'layers': layers,
      'project_name': project_name,
      'xsize': ximagesize,
      'ysize': yimagesize,
      'zsize': zimagesize,
      'xoffset': xoffset,
      'yoffset': yoffset,
      'zoffset': zoffset,
      'xdownmax': xdownmax,
      'ydownmax': ydownmax,
      'starttime': starttime,
      'endtime': endtime,
      'maxres': scalinglevels,
      'minres':0,
      'res': res,
      'xstart': x,
      'ystart': y,
      'zstart': z,
      'plane': orientation,
      'marker': marker,
      'timeseries': timeseries,
      'blendmode': blendmode,
      'version': VERSION,
  }
  return render(request, 'ndv/viewer.html', context)


# View a VizProject (pre-prepared project in the database)
def projectview(request, webargs):
  # parse web args
  # we expect /ocp/viz/project/projecttoken/res/x/y/z/
  # webargs starts from the next string after project

  # AB TODO needs to be regex-ified to make links work in manage page
  [project_name, restargs] = webargs.split('/', 1)
  restsplit = restargs.split('/')

  # initialize x,y,z,res and marker vars
  x = None
  y = None
  z = None
  res = None
  marker = False

  if len(restsplit) == 5:
    #  res/x/y/z/ args
    res = int(restsplit[0])
    x = int(restsplit[1])
    y = int(restsplit[2])
    z = int(restsplit[3])
    marker = True

  #else:
  #  # return error
  #  return HttpResponseBadRequest('Error: Invalid REST arguments.')

  # query for the project from the db
  project = get_object_or_404(VizProject, pk=project_name)
  layers = project.layers.select_related()

  timeseries = False
  for layer in layers:
    if layer.layertype == 'timeseries':
      timeseries = True
      break

  # calculate the lowest resolution xmax and ymax
  xdownmax = (project.ximagesize + project.xoffset - 1)/(2**project.scalinglevels)
  ydownmax = (project.yimagesize + project.yoffset - 1)/(2**project.scalinglevels)

  if x is None:
    x = xdownmax/2
  if y is None:
    y = ydownmax/2
  if z is None:
    z = project.zoffset
  if res is None:
    res = project.scalinglevels

  context = {
      'layers': layers,
      'project_name': project_name,
      'xsize': project.ximagesize,
      'ysize': project.yimagesize,
      'zsize': project.zimagesize,
      'zstart': project.zoffset,
      'xoffset': project.xoffset,
      'yoffset': project.yoffset,
      'zoffset': project.zoffset ,
      'maxres': project.scalinglevels,
      'minres':0,
      'res': res,
      'resstart': project.scalinglevels,
      'xstart': x,
      'ystart': y,
      'zstart': z,
      'starttime': project.starttime,
      'endtime': project.endtime,
      'plane': 'xy',
      'marker': marker,
      'timeseries': timeseries,
      'version': VERSION,
  }
  return render(request, 'ndv/viewer.html', context)

def getDataview(request, webargs):
  """ get the info from the dataview from the db and return it for the modal """

def dataview(request, webargs):
  """ display the given dataview """
  """ /dataview/<<dataview name>> """

  try:
    m = re.match(r"(?P<token>[\w:,-]+)(\/)?$", webargs)
    [token, misc] = [i for i in m.groups()]
    if token is None:
      return HttpResponseNotFound("[ERROR]: No token provided.")

  except Exception, e:
    print e
    return HttpResponseNotFound("[ERROR]: Incorrect format for web argument. Argument should be of the form '/dataview/token_for_dataview'")

  # get dataview from database
  dv = get_object_or_404( DataView, token = token )

  # build the URL to this view
  dv_url = "http://{}{}".format(request.META['HTTP_HOST'], request.META['PATH_INFO'])

  if (request.META['SCRIPT_NAME'] == ''):
    vizprojecturl = "http://{}/project/".format( request.META['HTTP_HOST'] )
  else:
    vizprojecturl = "http://{}{}/project/".format( request.META['HTTP_HOST'], request.META['SCRIPT_NAME'] )

  dv_items = dv.items.all()

  context = {
      'layers': None,
      'project_name': None,
      'xsize': 0,
      'ysize': 0,
      'zsize': 0,
      'xoffset': 0,
      'yoffset': 0,
      'zoffset': 0,
      'res': 0,
      'xdownmax': 0,
      'ydownmax': 0,
      'starttime': 0,
      'endtime': 0,
      'maxres': 0,
      'minres':0,
      'xstart': 0,
      'ystart': 0,
      'zstart': 0,
      'marker': 0,
      'plane': 'xy',
      'timeseries': False,
      'dataview': 'test',
      'version': VERSION,
      'dv_token': dv.token,
      'dv_desc': dv.desc,
      'dv_name': dv.name,
      'dv_link': dv_url,
      'dv_items': dv_items,
      'vizprojecturl': vizprojecturl,
      }
  return render(request, 'ndv/viewer.html', context)

def dataviewsPublic(request):
  """ display a list of all public dataviews """
  dataviews = DataView.objects.filter(public = True)

  context = {
    'dataviews': dataviews
  }

  return render(request, 'ndv/publicdata.html', context)

def query(request, queryargs):
  # redirects a query to the specified server
  # expected syntax is:
  # ocp/ocpviz/query/<<server>>/<<query>>
  # e.g. ocp/ocpviz/query/dsp061/ca/kharris15apical/info/
  [server, oquery] = queryargs.split('/', 1)
  if server not in VALID_SERVERS.keys():
    return HttpResponse("Error: Server not valid.")

  # make get request
  if server == 'localhost':
    #addr = Site.objects.get_current().domain + '/ocp/' + oquery
    if settings.OCP_SERVER is None:
      addr = 'http://' + request.META['HTTP_HOST'] + '/ocp/' + oquery
    else:
      addr = 'http://' + settings.OCP_SERVER + '/ocp/' + oquery
  else:
    addr = 'http://' + VALID_SERVERS[server] + '/ocp/' + oquery
  try:
    r = urllib2.urlopen(addr)
  except urllib2.HTTPError, e:
    r = '[ERROR]: ' + str(e.getcode())

  return HttpResponse(r)

def ramoninfo(request, webargs):
  # gets ramon info json from OCP
  # expected syntax is:
  # ocp/viz/ramoninfo/<<server>>/<<token>>/<<channel>>/<<id>>/

  [server, token, channel, objids] = webargs.split('/', 3)
  objids = objids.strip('/')
  if server not in VALID_SERVERS.keys():
    return HttpResponse("Error: Server not valid.")

  if server == 'localhost':
    if settings.OCP_SERVER is None:
      addr = 'http://{}/ocp/ca/{}/{}/{}/json/'.format( request.META['HTTP_HOST'], token, channel, objids )
    else:
      addr = 'http://{}/ocp/ca/{}/{}/{}/json/'.format( settings.OCP_SERVER, token, channel, objids )
  else:
    addr = 'http://{}/ocp/ca/{}/{}/{}/json/'.format( VALID_SERVERS[server], token, channel, objids )
  try:
    r = urllib2.urlopen(addr)
  except urllib2.HTTPError, e:
    if e.getcode() == 404:
      return HttpResponse('No RAMON Object for annotation.')
    else:
      r = '[ERROR]: ' + str(e.getcode())
      return HttpResponse(r)

  html = ''

  ramonjson = json.loads(r.read())

  for obj in objids.split(','):
    if obj not in ramonjson.keys():
      continue

    html += '<h5>{} #{}</h5>'.format( ramonjson[obj]['type'], obj )
    html += '<table class="table table-condensed"><tr><td>author</td><td>{}</td></tr><tr><td>neuron</td><td>{}</td></tr><tr><td>confidence:</td><td>{}</td></tr></table>'.format( ramonjson[obj]['metadata']['author'], ramonjson[obj]['metadata']['neuron'], ramonjson[obj]['metadata']['confidence'] )

  return HttpResponse(html)

def projinfo(request, queryargs):
  # gets the projinfo from ocp
  # expected syntax is:
  # ocp/viz/projinfo/<<server>>/<<token>>/
  # e.g. ocp/ocpviz/projinfo/dsp061/projinfo/kharris15apical/
  [server, token_raw] = queryargs.split('/', 1)
  token = token_raw.split('/')[0]
  if server not in VALID_SERVERS.keys():
    return HttpResponse("Error: Server not valid.")

  # make get request

  if server == 'localhost':
    #addr = Site.objects.get_current().domain + '/ocp/' + oquery
    if settings.OCP_SERVER == None:
      addr = 'http://' + request.META['HTTP_HOST'] + '/ocp/ca/' + token + '/info/'
    else:
      addr = 'http://' + settings.OCP_SERVER + '/ocp/ca/' + token + '/info/'
  else:
    addr = 'http://' + VALID_SERVERS[server] + '/ocp/ca/' + token + '/info/'
  try:
    r = urllib2.urlopen(addr)
  except urllib2.HTTPError, e:
    r = '[ERROR]: ' + str(e.getcode())
    return HttpResponse(r)

  jsoninfo = json.loads(r.read())

  # name, description
  html = '<strong>{}</strong><p>{}</p>'.format( jsoninfo['project']['name'], jsoninfo['project']['description'] )

  # channel info
  html += '<strong>Channels</strong><br />'
  for channel in jsoninfo['channels']:
    tmphtml = '{}<br /><ul><li>{} ({})</li>'.format( channel, jsoninfo['channels'][channel]['channel_type'], jsoninfo['channels'][channel]['datatype'] )

    if jsoninfo['channels'][channel]['windowrange'][1] > 0:
      tmphtml += '<li>Window (Intensity) Range: {}, {}</li><li>'.format( jsoninfo['channels'][channel]['windowrange'][0], jsoninfo['channels'][channel]['windowrange'][1])

    tmphtml += '<li>Default Resolution: {}</li>'.format(jsoninfo['channels'][channel]['resolution'])

    tmphtml += '</ul>'

    html += tmphtml;

  # metadata
  if len(jsoninfo['metadata'].keys()) == 0:
    html += '<p>No metadata for this project.</p>'
  else:
    html += '<p>Metadata support coming soon</p>'

  # dataset
  html += '<strong>Dataset Parameters</strong><br />'

  # x,y,z coords at res 0
  html += '<em>Base Imagesize</em><ul>'
  html += '<li><strong>x: </strong> {}, {}</li>'.format( jsoninfo['dataset']['offset']['0'][0], jsoninfo['dataset']['imagesize']['0'][0] )
  html += '<li><strong>y: </strong> {}, {}</li>'.format( jsoninfo['dataset']['offset']['0'][1], jsoninfo['dataset']['imagesize']['0'][1] )
  html += '<li><strong>z: </strong> {}, {}</li>'.format( jsoninfo['dataset']['offset']['0'][2], jsoninfo['dataset']['imagesize']['0'][2] )
  html += '</ul>'

  # number of resolutions
  html += '<em>Resolutions:</em> '
  for resolution in jsoninfo['dataset']['resolutions']:
    html += '{} '.format(resolution)

  # timerange
  if (jsoninfo['dataset']['timerange'][1] > 0):
    html += '<em>Timerange: </em>{}, {}'.format( jsoninfo['dataset']['timerange'][0], jsoninfo['dataset']['timerange'][1] )


  return HttpResponse(html)

def validate(request, webargs):
  # redirects a query to the specified server
  # expected syntax is:
  # ocp/ocpviz/query/<<server>>/<<query>>
  # e.g. ocp/ocpviz/query/dsp061/ca/kharris15apical/info/
  [token, channel, server] = webargs.split('/', 2)

  if (token == ''):
    return HttpResponseBadRequest('Missing Token Value')
  if (channel == ''):
    return HttpResponseBadRequest('Missing Channel Value')

  # strip the trailing / from the server name
  server = server.strip('/')

  # get the proj info for this token
  addr = 'http://{}/ocp/ca/{}/info/'.format(server, token)

  try:
    r = urllib2.urlopen(addr)
  except urllib2.HTTPError, e:
    return HttpResponseBadRequest(str(e.getcode()))

  # if we get a response, check to see the channel exists

  rjson = json.loads(r.read())
  for proj_channel in rjson['channels']:
    print proj_channel
    if channel == proj_channel:
      return HttpResponse('Valid')


  return HttpResponseBadRequest('Channel not found for project {} on server {}'.format(token, server))

def tileloader(request, webargs):
  # Forward a tile loading request to the appropriate server
  return HttpResponse('Tile Loaded')

# Manage
@login_required
def viewProjects(request):
    # get all projects for the currently logged in user
    projects = VizProject.objects.filter( user = request.user )
    dataviews = DataView.objects.filter( user = request.user )
    context = {
        'projects':projects,
        'dataviews':dataviews
    }
    return render(request, 'manage/viewprojects.html', context)

# Login / Logout
def processLogin(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    #import pdb; pdb.set_trace()
    if user is not None:
        if user.is_active:
            login(request, user)
            return HttpResponse('Success')
        else:
            # Return a 'disabled account' error message
            return HttpResponseBadRequest('Login Failed')
    else:
        # Return an 'invalid login' error message.
        return HttpResponseBadRequest('Login Failed')

def processLogout(request):
    logout(request)
    return HttpResponse('Success')
