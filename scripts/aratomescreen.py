import sys, os

import json
import csv
import re

import argparse

sys.path.append(os.path.abspath('../'))
import ndv.settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'ndv.settings'
from django.conf import settings
import django
django.setup()

from django.contrib.auth.models import User

from ndv.models import VizProject
from ndv.models import VizLayer
from ndv.models import DataView
from ndv.models import DataViewItem

class AratomeScreen():
    def __init__(self, intensity_data_file, metadata_file, prefix):
        # load intensity data
        self.intensities = {}
        with open(intensity_data_file, 'rb') as f:
            intensities_tmp = json.loads(f.read())
            for key in intensities_tmp.keys():
                token = intensities_tmp[key]['token']
                channel = intensities_tmp[key]['channel']
                if token in self.intensities.keys():
                    self.intensities[ token ][ channel ] = intensities_tmp[key]
                else:
                    self.intensities[ token ] = {}
                    self.intensities[ token ][ channel ] = intensities_tmp[key]

        # token --> channels
        self.metadata = {}
        with open(metadata_file, 'rb') as f:
            reader = csv.reader(f, delimiter=',')
            for row in reader:
                channel0 = row[3].replace(',','_').replace('/','_').replace('-','_').replace(' ', '_').replace('(', '').replace(')', '')
                channel1 = row[4].replace(',','_').replace('/','_').replace('-','_').replace(' ', '_').replace('(', '').replace(')', '')
                channel2 = row[5].replace(',','_').replace('/','_').replace('-','_').replace(' ', '_').replace('(', '').replace(')', '')
                channel3 = row[6].replace(',','_').replace('/','_').replace('-','_').replace(' ', '_').replace('(', '').replace(')', '')

                # remove +
                channel0 = channel0.replace('+', '')
                channel0 = re.sub(r'\W+', '', channel0)

                channel1 = channel1.replace('+', '')
                channel1 = re.sub(r'\W+', '', channel1)

                channel2 = channel2.replace('+', '')
                channel2 = re.sub(r'\W+', '', channel2)

                channel3 = channel3.replace('+', '')
                channel3 = re.sub(r'\W+', '', channel3)

                self.metadata['{}_S{:0>2}_W{:0>2}'.format(prefix, row[1], row[2])] = [(channel0, row[3]), (channel1, row[4]), (channel2, row[5]), (channel3, row[6])]

    def createVizProjects(self):
        """ Create vizprojects with 4 layers (one for each channel) per slide/well) """

        for token in self.intensities.keys():
            # make sure we have the metadata for this token
            if token in self.metadata.keys():
                vp = VizProject()
                channels = self.metadata[token]
                vp.project_name = token
                vp.project_description = 'Aratome Screen (20151015) with {}, {}, {}, and {}'.format( channels[0][1], channels[1][1], channels[2][1], channels[3][1]  )
                vp.public = 0
                vp.user = User.objects.get(id=1)
                # AB TODO process this in a smarter, more automated way
                vp.ximagesize = 16480
                vp.yimagesize = 4421
                vp.zimagesize = 4

                vp.scalinglevels = 5
                vp.save()
                for idx, channel_tuple in enumerate(channels):
                    vz = VizLayer()
                    vz.layer_name = channel_tuple[0]
                    vz.layer_description = channel_tuple[1]
                    vz.server = 'brainviz1.cs.jhu.edu'
                    vz.user = User.objects.get(id=1)

                    vz.layertype = 'image'

                    vz.token = token
                    vz.channel = channel_tuple[0]

                    # set the color
                    # standard settings for dapi and synapsin
                    # set the other two channels depending on their index in the list
                    if channel_tuple[0] == 'dapi':
                        vz.color = 'B'
                    elif channel_tuple[0] == 'rb_anti_synapsin':
                        vz.color = 'R'
                    else:
                        if idx % 2 == 0:
                            vz.color = 'Y'
                        else:
                            vz.color = 'M'

                    # write the object to the DB first
                    vz.save()
                    # then save it
                    vp.layers.add( vz )
                # save the project
                print "Added VizProject {}".format( vp.project_name )
                vp.save()


    def createDataView(self):
        """ Will create a dataview containing each of the vizprojects created using createVizProjects """
        dv = DataView()

        dv.name = 'Aratome Screen version C, 2015-10-15'
        dv.desc = 'Aratome Screen Data ingested on 2015-10-15. (Note: this is only a subset of the data that prepared for SfN 2015. Full dataset coming soon)'

        dv.token = 'aratome15c'

        dv.user = User.objects.get(id = 1)
        dv.save()

        for token in self.intensities.keys():
            # make sure we have the metadata for this token
            if token in self.metadata.keys():
                channels = self.metadata[token]

                dvi = DataViewItem()

                dvi.name = token
                dvi.desc_int = 'Aratome Screen (20151015)'
                dvi.caption = '{}, {}, {}, and {}'.format( channels[0][1], channels[1][1], channels[2][1], channels[3][1]  )

                dvi.user = User.objects.get(id = 1)

                dvi.vizproject = VizProject.objects.get(project_name = token)

                dvi.xstart = 450
                dvi.ystart = 70
                dvi.zstart = 0
                dvi.resstart = 5

                dvi.thumbnail_url = 'http://brainviz1.cs.jhu.edu/ocp/ca/{}/dapi/xy/4/300,400/0,100/0/'.format(token)
                dvi.save()
                dv.items.add(dvi)
                print "Added DataView item {}".format( token )

        dv.save()


def main():

    parser = argparse.ArgumentParser(description="Automatically create vizprojects and dataviews for Aratome data.")

    parser.add_argument('intensity_file', action='store', help='Path to the json file storing intensity information.')
    parser.add_argument('metadata_file', action='store', help='Path to the csv file storing aratome metadata.')
    parser.add_argument('prefix', action='store', help='Prefix for aratome screen tokens.')
    parser.add_argument('--skipvp', dest='skipvp', action='store_true', help='Skip creating viz projects.')
    parser.add_argument('--skipdv', dest='skipdv', action='store_true', help='Skip creating dataview.')

    result = parser.parse_args()

    aso = AratomeScreen(result.intensity_file, result.metadata_file, result.prefix)
    if result.skipvp is not True:
        aso.createVizProjects()
    if result.skipdv is not True:
        aso.createDataView()

if __name__ == '__main__':
    main()
