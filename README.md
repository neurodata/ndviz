# NeuroDataViz v0.4

Web visualization and analysis tool for displaying images and metadata from NeuroData / Open Connectome Project Datastores. Supported imaging modalities include:

 * Electron Microscopy
 * Array Tomography
 * CLARITY
 * Calcium Imaging (Time Series)
 * X-ray
 * Multimodal Magnetic Resonance Imaging

### Features 
 * Web based and mobile friendly.
 * Share regions of interest by placing a marker and sending colleagues a URL. 
 * 2D and 3D Time Series support with automated playback controls. 
 * Basic image processing, including opacity, brightness, contrast, and blending.
 * Dynamic metadata support. Query locations from the web interface and add your own metadata (coming soon).

## Installation 

Several NeuroDataViz configurations are possible:
 1. **NeuroDataViz Standalone** - a NDV installation pointed towards OCP / OCPTilecache on a remote server.
 2. **NeuroDataViz + OCPTilecache** - a NDV installation with OCPTilecache living on the same server.
 3. **NeuroDataViz + OCP (+ OCPTilecache)** - a NDV installation with OCP (and possibly OCPTilecache) living on the same server.

However, the general installation process for NDV is the same for each configuration. For more information on OCP (https://github.com/openconnectome/open-connectome/) and OCPTilecache (https://github.com/openconnectome/ocptilecache), see their respective respositories. 

### Dependencies 
*Note:* We recommend running NeuroDataViz inside a python virtualized environment. See http://virtualenvwrapper.readthedocs.org/en/latest/install.html for more information on virtualized environments. Assuming you create an environment called ```ndv```, make sure to run ```workon ndv``` on your command line before installing the dependencies below.

Required system packages include:
 * nginx (```sudo apt-get install nginx```)
 * mysql (```sudo apt-get install mysql-server mysql-client libmysqlclient-dev```)
 * python (system python is fine, 2.7+ recommended) and python development packages (```sudo apt-get install python-all-dev```)
 * python pip and python mysql (```sudo apt-get install python-pip python-mysqldb```)


Once the system packages are installed, we can add python dependencies. From the NDV root, install the dependencies in ```requirements.txt```.

``` pip install -r setup/requirements.txt ```

### Setup 
First, we will need to create a directory for NDV and either clone the repo or download a release. For the purpose of this tutorial, we will assume NDV lives in ```/var/www/ndv/```.

#### django / local database tables 
ABTODO

#### nginx 
ABTODO

#### uwsgi
ABTODO




