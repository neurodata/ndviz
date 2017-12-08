#!/usr/bin/env python
import os
import subprocess
import shutil 

from distutils.command.build import build

from setuptools import Extension, find_packages, setup

try:
    import numpy as np
except ImportError:
    print('Please install numpy before installing ndviz/neuroglancer')
    raise

client_static_files = ['main.bundle.js', 'chunk_worker.bundle.js', 'styles.css', 'index.html']
static_files = list(client_static_files)

class bundle_client(build):

    user_options = [
        ('client-bundle-type=', None,
         'The nodejs bundle type. "min" (default) creates condensed static files for production, "dev" creates human-readable files.'
         )
    ]

    def initialize_options(self):

        self.client_bundle_type = 'dev'

    def finalize_options(self):

        if self.client_bundle_type not in ['min', 'dev']:
            raise RuntimeError('client-bundle-type has to be one of "min" or "dev"')

    def run(self):

        this_dir = os.path.abspath(os.path.dirname(__file__))
        project_dir = os.path.join(this_dir, '..')

        build_dir = os.path.join(project_dir, 'build/python-' + self.client_bundle_type)
        static_dir = os.path.join(this_dir, 'ndviz/static')

        print("Project dir " + project_dir)
        print("Build dir " + build_dir)
        print("Static dir " + static_dir)

        prev_dir = os.path.abspath('.')
        os.chdir(project_dir)
    
        target = {"min": "build-python-min", "dev": "build-python"}

        try:
            t = target[self.client_bundle_type]
            subprocess.call(['npm', 'i'])
            subprocess.call(['npm', 'link', 'neuroglancer'])
            res = subprocess.call(['npm', 'run', t])
        except:
            raise RuntimeError(
                'Could not run \'npm run %s\'. Make sure node.js >= v5.9.0 is installed and in your path.'
                % t)

        if res != 0:
            raise RuntimeError('failed to bundle neuroglancer node.js project')

        try:
            os.mkdir(static_dir)
        except OSError:
            pass

        for f in client_static_files:
            shutil.copy(os.path.join(build_dir, f), os.path.join(static_dir, f))

        # Copy the NDViz static files directory
        shutil.rmtree(os.path.join(static_dir, "static"), ignore_errors=True)
 
        shutil.copytree(os.path.join(project_dir, "static"), os.path.join(static_dir, "static"))        

        os.chdir(prev_dir)

# TODO(adb): should find a way to have some parity between static files in the NDViz server and the python version
# Update static_files to include anything in the static directory 
static_folders = ['css', 'fonts', 'fonts/gentona', 'fonts/quadon', 'img']
static_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'ndviz/static')
for folder in static_folders:
    try:
        for f in os.listdir(os.path.join(static_dir, "static", folder)):
            static_files.append("static/{}/{}".format(folder, f))
    except:
        pass

setup(
    name='ndviz',
    version='2.0.1',
    description='Python backend for ndviz, powered by Neuroglancer',
    author='Alex Baden',
    url='https://github.com/neurodata/ndviz',
    license='Apache License 2.0',
    packages=find_packages(),
    package_data = {
        'ndviz.static': static_files,
    },
    install_requires=['neuroglancer'],
    extras_require={
        ":python_version<'3.2'": ['futures'],
    },
    cmdclass={'bundle_client': bundle_client},
)