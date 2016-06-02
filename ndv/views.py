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

VERSION = 'v0.7 Beta'

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
    'brainviz1.cs.jhu.edu':'brainviz1.cs.jhu.edu',
    'synaptomes.neurodata.io':'synaptomes.neurodata.io',
}

QUERY_TYPES = ['ANNOS']

BLENDOPTS = {
    'normal' : 1,
    'additive' : 2,
    'screen' : 2, # backwards compatibility
    'subtractive': 3,
    'multiply' : 4,
    'none' : 0
}

ANNO_TYPES = {
    1 : 'Annotation',
    2 : 'Synapse',
    3 : 'Seed',
    4 : 'Segment',
    5 : 'Neuron',
    6 : 'Organelle',
    7 : 'Node',
    8 : 'Skeleton',
    9 : 'ROI',
}

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
      'viewtype': 'default',
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
    m = re.match(r"(?P<token>\w+)/?(?!(xy|xz|yz))(?P<channels>[\w+,:-]+)?/?(?P<plane>xy|xz|yz)?/(?P<cutout>[\d,/-]+)?/?(?P<options>[\w:,{}]+)?/?$", webargs)
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
    channel_info[channel]['propagate'] = jsoninfo['channels'][channel]['propagate']

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
    #tmp_layer.token = project_name
    tmp_layer.token = token_str
    tmp_layer.channel = channel['channel_name']
    if settings.OCP_SERVER is None:
      tmp_layer.server = request.META['HTTP_HOST'];
    else:
      tmp_layer.server = settings.OCP_SERVER
    tmp_layer.tilecache = False
    if channel['channel_name'] in channel_colors.keys():
      tmp_layer.color = channel_colors[ channel['channel_name'] ].upper()
    tmp_layer.propagate = channel['propagate']
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
  blendmode = BLENDOPTS['normal']
  if options is not None:
    if 'marker' in options.keys():
      marker = True
    if 'blend' in options.keys() and options['blend'] in BLENDOPTS.keys():
      blendmode = BLENDOPTS[ options['blend'].lower() ]

  context = {
      'layers': layers,
      'project_name': project_name,
      'token': token_str,
      'allchannels': channel_info,
      'tokenserver': layers[0].server, # TODO could we pull this info from somewhere else?
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
      'viewtype': 'tokenview',
  }
  return render(request, 'ndv/viewer.html', context)


# View a VizProject (pre-prepared project in the database)
def projectview(request, webargs):
  """ /<<project>>/<<plane>>(opt)/<<res>/<<x>>/<<y>>/<<z>>/<<options>>/ """

  # initialize these variables, which will be passed to the template
  x = None
  y = None
  z = None
  res = None
  marker = False

  options = None

  # process arguments
  try:
    m = re.match(r"(?P<token>\w+)?/?(?P<plane>xy|xz|yz)?/?(?P<cutout>[\d,/-]+)?/?(?P<options>[\w:,{}]+)?/?$", webargs)
    [project_name, orientation, cutoutstr, options_str] = [i for i in m.groups()]

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

  # get dataviews for project
  dvi = DataViewItem.objects.filter(vizproject = project_name)
  dv = DataView.objects.filter(items = dvi)

  blendmode = BLENDOPTS[project.blendmode]
  if options is not None:
    if 'marker' in options.keys():
      marker = True
    if 'blend' in options.keys() and options['blend'] in BLENDOPTS.keys():
      blendmode = BLENDOPTS[ options['blend'].lower() ]

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
      'blendmode': blendmode,
      'version': VERSION,
      'viewtype': 'projectview',
      'dataviews': dv,
  }
  return render(request, 'ndv/viewer.html', context)

def manage(request):
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
      'viewtype': 'manage',
      'manage': True,
      }
  return render(request, 'ndv/viewer.html', context)

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
      'version': VERSION,
      'viewtype': 'dataview',
      'dv_token': token,
      }
  return render(request, 'ndv/viewer.html', context)

def renderDataview(request, webargs):
  """ Create the DataView HTML """

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

  # build URLs
  if (request.META['SCRIPT_NAME'] == ''):
    vizprojecturl = "http://{}/project/".format( request.META['HTTP_HOST'] )
    dv_url = "http://{}/dataview/{}".format( request.META['HTTP_HOST'], token )
  else:
    vizprojecturl = "http://{}{}/project/".format( request.META['HTTP_HOST'], request.META['SCRIPT_NAME'] )
    dv_url = "http://{}{}/dataview/{}".format( request.META['HTTP_HOST'], request.META['SCRIPT_NAME'], token )

  dv_items = dv.items.all()

  context = {
    'dv_token': dv.token,
    'dv_desc': dv.desc,
    'dv_name': dv.name,
    'dv_link': dv_url,
    'dv_items': dv_items,
    'vizprojecturl': vizprojecturl,
  }
  return render(request, 'ndv/dataview.html', context)

def dataviewsPublic(request):
  """ display a list of all public dataviews """
  dataviews = DataView.objects.filter(public = True)

  context = {
    'dataviews': dataviews
  }

  return render(request, 'ndv/publicdata.html', context)

def listPublic(request):

  dvpub = DataView.objects.filter(public = True)

  jsonlist = []

  for dataview in dvpub:
    tmp = {}
    tmp['name'] = dataview.name
    tmp['desc'] = dataview.desc
    tmp['token'] = dataview.token
    jsonlist.append(tmp)

  return HttpResponse( json.dumps( jsonlist ), content_type="application/json" )


def query(request, queryargs):
  # redirects a query to the specified server
  # expected syntax is:
  # query/<<server.tld>>/<<query>>
  # e.g. ocp/ocpviz/query/dsp061.pha.jhu.edu/ca/kharris15apical/info/
  [server, oquery] = queryargs.split('/', 1)
  """
  if server not in VALID_SERVERS.keys():
    return HttpResponse("Error: Server not valid.")
  """

  # make get request
  if server == 'localhost':
    #addr = Site.objects.get_current().domain + '/ocp/' + oquery
    if settings.OCP_SERVER is None:
      addr = 'http://' + request.META['HTTP_HOST'] + '/ocp/' + oquery
    else:
      addr = 'http://' + settings.OCP_SERVER + '/ocp/' + oquery
  else:
    addr = 'http://' + server + '/ocp/' + oquery
  try:
    r = urllib2.urlopen(addr)
  except urllib2.HTTPError, e:
    r = '[ERROR]: ' + str(e.getcode())

  return HttpResponse(r)

def ramoninfo(request, webargs):
  # gets ramon info json from OCP
  # expected syntax is:
  # ramoninfo/<<serverhostname>>/<<token>>/<<channel>>/<<id>>/

  [server, token, channel, objids] = webargs.split('/', 3)
  objids = objids.strip('/')

  if server == 'localhost':
    if settings.OCP_SERVER is None:
      addr = 'http://{}/ocp/ca/{}/{}/{}/json/'.format( request.META['HTTP_HOST'], token, channel, objids )
    else:
      addr = 'http://{}/ocp/ca/{}/{}/{}/json/'.format( settings.OCP_SERVER, token, channel, objids )
  else:
    addr = 'http://{}/ocp/ca/{}/{}/{}/json/'.format( server, token, channel, objids )
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
    # AB 20160414 -- psuedo-updated for microns 
    html += '<h5>{} #{}</h5>'.format( ANNO_TYPES[ramonjson[obj]['ann_type']], obj )
    html += '<table class="table table-condensed">'
    for item in ramonjson[obj]:
      # all items are kvpairs
      html += '<tr><td>{}</td><td>{}</td></tr>'.format( item.replace('_', ' ').capitalize(), ramonjson[obj][item] ) 

      """
      if item == 'kvpairs':
        kvhtml = ''
        for kvpair in ramonjson[obj]['metadata']['kvpairs'].keys():
          kvhtml += '<tr><td>{}</td><td>{}</td></tr>'.format( kvpair.capitalize(),  ramonjson[obj]['metadata']['kvpairs'][kvpair] )
      else:
        html += '<tr><td>{}</td><td>{}</td></tr>'.format( item.replace('_',' ').capitalize(),  ramonjson[obj]['metadata'][item] )
      """

    #html += kvhtml # kvpairs at the bottom
    html += '</table>'
  return HttpResponse(html)

def projinfo(request, queryargs):
  # gets the projinfo from ocp
  # expected syntax is:
  # ndv/projinfo/<<server>>/<<token>>/
  # e.g. ndv/projinfo/dsp061/kharris15apical/
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

  # metadata
  if len(jsoninfo['metadata'].keys()) == 0:
    metadatahtml = '<p>No LIMS metadata for this project.</p>'
  else:
    metadatahtml = '<p>LIMS Metadata support coming soon</p>'

  context = {
    'projectname': jsoninfo['project']['name'],
    'projectdesc': jsoninfo['project']['description'],
    'channels': jsoninfo['channels'],
    'metadata': metadatahtml,
    'offset': jsoninfo['dataset']['offset']['0'],
    'imagesize': jsoninfo['dataset']['imagesize']['0'],
    'resolutions': jsoninfo['dataset']['resolutions'],
    'timerange': jsoninfo['dataset']['timerange'],
  }

  return render(request, 'ndv/projinfo.html', context)

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

@login_required
def getLayers(request, project):
  # get all layers for a project
  projectobj = get_object_or_404(VizProject, project_name=project)

  layers = VizLayer.objects.filter(project = projectobj)
  context = {
    'layers': layers,
  }
  return render(request, 'manage/getlayers.html', context)

@login_required
def editVizProject(request, project):
  if request.method == 'GET':
    projectobj = get_object_or_404(VizProject, project_name=project)
    layers = VizLayer.objects.filter(project = projectobj)
    context = {
      'project': projectobj,
      'layers': layers,
      'serverOptions': VizLayer.SERVER_CHOICES,
      'layerOptions': VizLayer.LAYER_CHOICES,
      'colorOptions' : VizLayer.COLOR_CHOICES,
      'blendOptions' : VizProject.BLEND_CHOICES,
    }
    return render(request, 'manage/editvizproject.html', context)
  else:
    return HttpResponseBadRequest('Invalid Request')

@login_required
def deleteLayer(request):
  if request.method == 'POST':
    response = request.POST
    try:
      projobj = VizProject.objects.get(project_name = response['project'] )
    except VizProject.DoesNotExist:
      return HttpResponseNotFound('VizProject {} not found!'.format( response['project'] ));

    layers = projobj.layers.select_related()
    for layer in layers:
      if layer.layer_name == response['layer']:
        try:
          layer.delete()
          return HttpResponse('Delete OK.')
        except Exception as e:
          return HttpResponseBadRequest('Error: Failed to delete VizLayer!')
    return HttpResponseNotFound('VizLayer {} not found.'.format( response['layer'] ))
  else:
    return HttpResponseBadRequest('Invalid Request')

@login_required
def addVizProject(request):
  # note that this method will save a new vizproject with or without layers
  # layers can be added later in the edit vizproject page
  if request.method == 'POST':
    response = request.POST

    existingProj = VizProject.objects.filter(project_name = response['projectName'])
    if len(existingProj) > 0:
      return HttpResponseBadRequest('Error: Project {} already exists!'.format(response['projectName']))

    # separate out layers
    layersNew = {}
    for item in response.keys():
      if item.startswith('layer'):
        [itemtype, sep, layername] = item.partition('_')
        itemtype = itemtype[5:].lower()
        if layername not in layersNew.keys():
          layersNew[layername] = {}
        layersNew[layername][itemtype] = response[item]

    # create new project
    proj = VizProject()
    proj.project_name = response['projectName']
    proj.project_description = response['projectDesc']
    proj.user = request.user
    if 'public' in response.keys():
      proj.public = 1
    else:
      proj.public = 0

    proj.xoffset = response['xoffset']
    proj.yoffset = response['yoffset']
    proj.zoffset = response['zoffset']

    proj.ximagesize = response['ximagesize']
    proj.yimagesize = response['yimagesize']
    proj.zimagesize = response['zimagesize']

    proj.starttime = response['starttime']
    proj.endtime = response['endtime']

    proj.minres = response['minres']
    proj.scalinglevels = response['scalinglevels']
    proj.blendmode = response['blendmode']

    layers = []
    # add new layers
    for layerKey in layersNew.keys():
      if layerKey.startswith('newlayer'):
        layer = VizLayer()
        layerInfo = layersNew[layerKey]

        layer.layer_name = layerInfo['name']
        layer.layer_description = layerInfo['desc']
        layer.server = layerInfo['server']
        layer.layertype = layerInfo['type']
        layer.token = layerInfo['token'].strip()
        layer.channel = layerInfo['channel'].strip()
        layer.color = layerInfo['color']

        if 'tilecache' in layerInfo.keys():
          layer.tilecache = True
          if len(layerInfo['tilecacheserver']) > 0:
            layer.tilecache_server = layerInfo['tilecacheserver']
        else:
          layer.tilecache = False

        if 'propagated' in layerInfo.keys():
          layer.propagate = 2
        else:
          layer.propagate = 0

        # since this is a new layer, we need to associate it w/ the editing user
        layer.user = request.user

        layers.append(layer)

    # after creating everything, save changes (this allows for error handling)
    try:
      # must save the project first due to foreign key contraints
      proj.save()
      for layer in layers:
        layer.save()
        proj.layers.add(layer)

    except Exception as e:
      return HttpResponseBadRequest('Error: Exception occurred during save! ({})'.format(e))
    return HttpResponse('Added Project Successfully')
  else:
    context = {
      'serverOptions': VizLayer.SERVER_CHOICES,
      'layerOptions': VizLayer.LAYER_CHOICES,
      'colorOptions': VizLayer.COLOR_CHOICES,
      'blendOptions': VizProject.BLEND_CHOICES,
    }
    return render(request, 'manage/addvizproject.html', context)

@login_required
def deleteVizProject(request):
  if request.method == 'POST':
    response = request.POST
    try:
      projobj = VizProject.objects.get(project_name = response['project'] )
    except VizProject.DoesNotExist:
      return HttpResponseNotFound('VizProject {} not found!'.format( response['project'] ));

    layers = projobj.layers.select_related()

    for layer in layers:
      layer.delete()

    try:
      projobj.delete()
    except Exception as e:
      return HttpResponseBadRequest('Error: Failed to delete VizProject!')

    return HttpResponse('Delete OK.')

  return HttpResponseBadRequest('Invalid Request')

@login_required
def editVizProjectSubmit(request):
  if request.method == 'POST':
    # parse the response
    projNameOrig = request.POST['oldProjectName']
    response = request.POST

    # process layer updates
    layersNew = {}
    for item in response.keys():
      if item.startswith('layer'):
        [itemtype, sep, layername] = item.partition('_')
        itemtype = itemtype[5:].lower()
        if layername not in layersNew.keys():
          layersNew[layername] = {}
        layersNew[layername][itemtype] = response[item]

    # get the original project / layers
    try:
      proj = VizProject.objects.get(project_name = projNameOrig)
    except VizProject.DoesNotExist:
      return HttpResponseBadRequest('Error: Project {} does not exist!'.format(projNameOrig))

    layers = proj.layers.select_related()

    # apply changes to project
    proj.project_name = response['projectName']
    proj.project_description = response['projectDesc']
    #proj.user = request.user
    if 'public' in response.keys():
      proj.public = 1
    else:
      proj.public = 0

    proj.xoffset = response['xoffset']
    proj.yoffset = response['yoffset']
    proj.zoffset = response['zoffset']

    proj.ximagesize = response['ximagesize']
    proj.yimagesize = response['yimagesize']
    proj.zimagesize = response['zimagesize']

    proj.starttime = response['starttime']
    proj.endtime = response['endtime']

    proj.minres = response['minres']
    proj.scalinglevels = response['scalinglevels']
    proj.blendmode = response['blendmode']

    # apply changes to layers

    for layer in layers:
      if str(layer.id) in layersNew.keys():
        layerInfo = layersNew[str(layer.id)]
        layer.layer_name = layerInfo['name']
        layer.layer_description = layerInfo['desc']
        layer.server = layerInfo['server']
        layer.layertype = layerInfo['type']
        layer.token = layerInfo['token'].strip()
        layer.channel = layerInfo['channel'].strip()
        layer.color = layerInfo['color']

        if 'tilecache' in layerInfo.keys():
          layer.tilecache = True
        else:
          layer.tilecache = False

        if 'propagated' in layerInfo.keys():
          layer.propagate = 2
        else:
          layer.propagate = 0

    # Note: Any error checking must be done before this point. After this point, all changes are saved to the DB.

    # add new layers
    for layerKey in layersNew.keys():
      if layerKey.startswith('newlayer'):
        layer = VizLayer()
        layerInfo = layersNew[layerKey]

        layer.layer_name = layerInfo['name']
        layer.layer_description = layerInfo['desc']
        layer.server = layerInfo['server']
        layer.layertype = layerInfo['type']
        layer.token = layerInfo['token'].strip()
        layer.channel = layerInfo['channel'].strip()
        layer.color = layerInfo['color']

        if 'tilecache' in layerInfo.keys():
          layer.tilecache = True
        else:
          layer.tilecache = False

        if 'propagated' in layerInfo.keys():
          layer.propagate = 2
        else:
          layer.propagate = 0

        # since this is a new layer, we need to associate it w/ the editing user
        layer.user = request.user

        # associate this layer with the vizproject
        layer.save()
        proj.layers.add(layer)

    # save changes made to existing objects
    for layer in layers:
      layer.save()

    # changing the primary key will create a new object
    if proj.project_name == projNameOrig:
      proj.save()
    else:
      # project name changed
      proj.save()
      # reassociate with vizlayers
      for layer in layers:
        proj.layers.add(layer)
      try:
        proj_old = VizProject.objects.get(project_name = projNameOrig)
        for layer in layers:
          proj_old.layers.remove(layer)
        proj_old.delete()
      except Exception, e:
        return HttpResponseBadRequest('Error changing name of VizProject: {}'.format(e))
    proj.save()

    return HttpResponse('Saved Changes Successfully')
  else:
    return HttpResponseBadRequest('Invalid Request')

@login_required
def addDataview(request):
  if request.method == 'GET':
    # get list of vizprojects for the current user
    projlist = VizProject.objects.filter( user = request.user ).values_list('project_name')
    # display form
    context = {
      'vizProjects': projlist,
    }
    return render(request, 'manage/adddataview.html', context)
  elif request.method == 'POST':

    response = request.POST

    # the name is the primary key, but the token must also be unique for URL access
    existingDvName = DataView.objects.filter(name = response['dataviewName'])
    existingDvToken = DataView.objects.filter(token = response['dataviewToken'])
    if len(existingDvName) > 0:
      return HttpResponseBadRequest('Error: Dataview with name {} already exists!'.format(response['dataviewName']))
    elif len(existingDvToken) > 0:
      return HttpResponseBadRequest('Error: Dataview with token {} already exists!'.format(response['dataviewToken']))

    # separate out items
    itemsNew = {}
    for item in response.keys():
      if item.startswith('item'):
        [itemtype, sep, itemname] = item.partition('_')
        itemtype = itemtype[4:].lower() # remove the 'item' prefix
        if itemname not in itemsNew.keys():
          itemsNew[itemname] = {}
        itemsNew[itemname][itemtype] = response[item]

    # create new DataView
    dv = DataView()
    dv.name = response['dataviewName']
    dv.desc = response['dataviewDesc']
    dv.token = response['dataviewToken']
    dv.user = request.user
    if 'public' in response.keys():
      dv.public = 1
    else:
      dv.public = 0

    items = []
    # add new items
    for itemKey in itemsNew.keys():
      if itemKey.startswith('newitem'):
        dvitem = DataViewItem()
        itemInfo = itemsNew[itemKey]

        dvitem.name = itemInfo['name']
        dvitem.desc_int = itemInfo['desc']
        dvitem.caption = itemInfo['caption']
        dvitem.user = request.user

        try:
          vizproj = VizProject.objects.get(project_name = itemInfo['project'])
          dvitem.vizproject = vizproj
        except VizProject.DoesNotExist:
          return HttpResponseBadRequest('Could not locate VizProject {}'.format(itemInfo['project']))

        dvitem.xstart = itemInfo['xstart']
        dvitem.ystart = itemInfo['ystart']
        dvitem.zstart = itemInfo['zstart']
        dvitem.resstart = itemInfo['resstart']

        if 'marker' in itemInfo.keys():
          dvitem.marker_start = True
        else:
          dvitem.marker_start = False

        dvitem.thumbnail_url = itemInfo['thumbnailurl']

        items.append(dvitem)

    # after creating everything, save changes (this allows for error handling)
    try:
      # must save the project first due to foreign key contraints
      dv.save()
      for item in items:
        item.save()
        dv.items.add(item)

    except Exception as e:
      return HttpResponseBadRequest('Error: Exception occurred during save! ({})'.format(e))
    return HttpResponse('Added Dataview Successfully')
  else:
    return HttpResponseBadRequest('Invalid Request')

@login_required
def editDataview(request, token):
  if request.method == 'GET':
    dvobj = get_object_or_404(DataView, token=token)
    items = DataViewItem.objects.filter(dataview = dvobj)
    projlist = VizProject.objects.filter( user = request.user ).values_list('project_name')
    context = {
      'dv': dvobj,
      'items': items,
      'vizProjects': projlist,
    }
    return render(request, 'manage/editdataview.html', context)
  else:
    return HttpResponseBadRequest('Invalid Request')

@login_required
def editDataviewSubmit(request):
  if request.method == 'POST':
    # parse the response
    dvNameOrig = request.POST['oldDataviewName']
    response = request.POST

    # process item updates
    itemsNew = {}
    for item in response.keys():
      if item.startswith('item'):
        [itemtype, sep, itemname] = item.partition('_')
        itemtype = itemtype[4:].lower()
        if itemname not in itemsNew.keys():
          itemsNew[itemname] = {}
        itemsNew[itemname][itemtype] = response[item]

    # get the original dataview and its items
    try:
      dvobj = DataView.objects.get(name = dvNameOrig)
    except DataView.DoesNotExist:
      return HttpResponseBadRequest('Error: Dataview {} does not exist!'.format(dvNameOrig))

    items = dvobj.items.select_related()

    # apply changes to dataview
    dvobj.name = response['dataviewName']
    dvobj.desc = response['dataviewDesc']
    dvobj.token = response['dataviewToken']
    #dvobj.user = request.user
    if 'public' in response.keys():
      dvobj.public = 1
    else:
      dvobj.public = 0

    # apply changes to items

    for dvitem in items:
      # use ID instead of name since names have spaces (bad for AJAX)
      if str(dvitem.id) in itemsNew.keys():
        itemInfo = itemsNew[str(dvitem.id)]
        dvitem.name = itemInfo['name']
        dvitem.desc_int = itemInfo['desc']
        dvitem.caption = itemInfo['caption']

        try:
          vizproj = VizProject.objects.get(project_name = itemInfo['project'])
          dvitem.vizproject = vizproj
        except VizProject.DoesNotExist:
          return HttpResponseBadRequest('Could not locate VizProject {}'.format(itemInfo['project']))

        dvitem.xstart = itemInfo['xstart']
        dvitem.ystart = itemInfo['ystart']
        dvitem.zstart = itemInfo['zstart']
        dvitem.resstart = itemInfo['resstart']

        if 'marker' in itemInfo.keys():
          dvitem.marker_start = True
        else:
          dvitem.marker_start = False

        dvitem.thumbnail_url = itemInfo['thumbnailurl']

    # Note: Any error checking must be done before this point. After this point, all changes are saved to the DB.

    # add new items
    for itemKey in itemsNew.keys():
      if itemKey.startswith('newitem'):
        dvitem = DataViewItem()
        itemInfo = itemsNew[itemKey]

        dvitem.name = itemInfo['name']
        dvitem.desc_int = itemInfo['desc']
        dvitem.caption = itemInfo['caption']
        dvitem.user = request.user

        try:
          vizproj = VizProject.objects.get(project_name = itemInfo['project'])
          dvitem.vizproject = vizproj
        except VizProject.DoesNotExist:
          return HttpResponseBadRequest('Could not locate VizProject {}'.format(itemInfo['project']))

        dvitem.xstart = itemInfo['xstart']
        dvitem.ystart = itemInfo['ystart']
        dvitem.zstart = itemInfo['zstart']
        dvitem.resstart = itemInfo['resstart']

        if 'marker' in itemInfo.keys():
          dvitem.marker_start = True
        else:
          dvitem.marker_start = False

        dvitem.thumbnail_url = itemInfo['thumbnailurl']

        # save and associate with the dataview
        dvitem.save()
        dvobj.items.add(dvitem)

    # save changes made to existing objects
    for dvitem in items:
      dvitem.save()

    # changing the primary key will create a new object
    if dvobj.name == dvNameOrig:
      dvobj.save()
    else:
      # dataview name changed
      dvobj.save()
      # reassociate with dataview items
      for dvitem in items:
        dvobj.items.add(dvitem)
      try:
        dvobj_old = DataView.objects.get(name = dvNameOrig)
        for dvitem in items:
          dvobj_old.items.remove(dvitem)
        dvobj_old.delete()
      except Exception, e:
        return HttpResponseBadRequest('Error changing name of DataView: {}'.format(e))

    return HttpResponse('Saved Changes Successfully')
  else:
    return HttpResponseBadRequest('Invalid Request')

@login_required
def deleteDataview(request):
  if request.method == 'POST':
    response = request.POST
    try:
      dvobj = DataView.objects.get(token = response['dataview_token'] )
    except DataView.DoesNotExist:
      return HttpResponseNotFound('DataView {} not found!'.format( response['dataview'] ));

    items = dvobj.items.select_related()

    for item in items:
      item.delete()

    try:
      dvobj.delete()
    except Exception as e:
      return HttpResponseBadRequest('Error: Failed to delete DataView! {}'.format(e))

    return HttpResponse('Delete OK.')

  return HttpResponseBadRequest('Invalid Request')

@login_required
def deleteDataviewItem(request):
  if request.method == 'POST':
    response = request.POST
    try:
      dvobj = DataView.objects.get(name = response['dataview'] )
    except DataView.DoesNotExist:
      return HttpResponseNotFound('DataView {} not found!'.format( response['dataview'] ));

    items = dvobj.items.select_related()
    for dvitem in items:
      if dvitem.id == int(response['dvitem']): # names can have spaces, so compare on ID
        try:
          dvitem.delete()
          return HttpResponse('Delete OK.')
        except Exception as e:
          return HttpResponseBadRequest('Error: Failed to delete DataView Item! {}'.format(e))
    return HttpResponseNotFound('DataView Item {} not found.'.format( response['dvitem'] ))
  else:
    return HttpResponseBadRequest('Invalid Request')

@login_required
def autopopulateDataset(request, webargs):
  [server, token_raw] = webargs.split('/', 1)
  token = token_raw.split('/')[0]

  # make get request to ocp

  if server == 'localhost':
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
    return HttpResponseBadRequest(r)

  return HttpResponse(r.read())

# Login / Logout
def processLogin(request):
  if request.method == 'POST':
    username = request.POST.get('username')
    password = request.POST.get('password')
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
  else:
    return redirect(default)

def processLogout(request):
    logout(request)
    return HttpResponse('Success')
