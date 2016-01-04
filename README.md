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

#### settings.py 
 1. Navigate to the ```ndv``` folder in the NDV root directory (using the example above, this would be ```/var/www/ndv/ndv/```).
 2. Copy ```settings.py.example``` to ```settings.py``` and open it in a text editor.
 3. On line 20, set the ```OCP_SERVER``` to the URL of the server you would like to use (default is use case 3, above).
 4. On lines 27 and 28, set your Google Analytics tracking number (if you are running Google Analytics and want to log visitor traffic).
 5. If you would like to host NDV at a root domain (for example, ```viz.neurodata.io```) comment out line 41.

#### MySQL
 1. Create a new MySQL user. The following command is for MySQL 5.6: 
 
 ```SQL
 create user 'brain'@'localhost' identified by 'INSERT_YOUR_PLAINTEXT_PASSWORD_HERE';
 grant all privileges on *.* to 'brain'@'localhost' with grant option;
 ```

 2. Create a database for NDV:
 
 ```SQL
 create database NeuroDataViz;
 ```

#### settings_secret.py
 1. Enter your MySQL database user, password, and host. 
 2. Make up a secret key. It should be a fairly long combination of letters, numbers, and symbols. You don't need to remember it. 

#### django / local database tables 
From the NDV root directory, run the following:
 1. If you are using python virtual environments, ensure you are working in your ndv virtual environment.
 2. ```python manage.py migrate``` (creates database tables)
 3. ```python manage.py collectstatic``` (moves static files to a web readable static files directory)
 4. ```python manage.py runserver``` (starts the development server for testing)
 
You should now be able to browse to ```http://yourmachineIP:8000/ndv``` and load NDV, running on the development server. If all is well and the develpoment server started with no errors, kill the development server (```Ctrl + C```) and proceed to the next step. 

#### nginx 
Add the following to your nginx configuration. **Note: You may need to change some paths if you've deviated from the suggestions above.**
```
upstream ndv-wsgi{
  server unix:///var/run/uwsgi/ndv.sock;
}

server {
 listen  80;
 server_name <<insert_your_hostname_here>>;
 
 location / {
  uwsgi_pass  ndv-wsgi;
  include     /etc/nginx/uwsgi_params;
 }
 
 location /static/ {
  alias /var/www/ndv/static/;
 }
}
```

#### uwsgi
uwsgi configuration can vary widely. However, the following parameters file is essentially unchanged (even if you are using emperor mode). In the default configuration on Ubuntu 14.04, this file would live at ```/etc/uwsgi/apps-enabled/ndv.ini```.

```
; uWSGI instance configuration for NDV
[uwsgi]
processes = 4
chdir = /var/www/ndv/
socket = /run/uwsgi/app/ndv/socket
wsgi-file = /var/www/ndv/ndv/wsgi.py
plugin = python
virtualenv = /home/alex/.virtualenvs/ndv 
buffer-size = 8192
```




