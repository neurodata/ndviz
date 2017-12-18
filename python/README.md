# NeuroDataViz Python

The NeuroDataViz Python package extends [Neuroglancer Python](https://github.com/google/neuroglancer/tree/ndmaster/python) to support the NeuroDataViz functionality while retaining the existing Neuroglancer Python features. 

## Installation

#### 0. Virtual Environment

We recommend using a virtual environment. With Python3, you can easily create a new virtual environment using a command similar to the following in the `ndviz/python` directory:
```
python3 -m venv ndviz-env
```
This will create a `ndviz-env` folder in the `ndviz/python` directory. To use the virtual environment:
```
. ndviz-env/bin/activate
```

#### 1. Numpy
First, install `numpy`:
```
pip install numpy
```

#### 2. Neuroglancer Python

Next, you will need to install Neuroglancer Python. To get the latest version, we recommend cloning the Neuroglancer repository and using the `setup.py` script inside the `neuroglancer/python` directory.

Note that if your system includes the `gcc` compiler you can change the `USE_OMP` variable to be `True` in `setup.py` and take advantage of multi-threaded mesh generation in Neuroglancer Python.

Once your `setup.py` file is setup, run the installer:
```
python setup.py install
```

#### 3. Ndviz Python

Finally, use the `setup.py` file in `ndviz/python`:
```
python setup.py install
```

## Building Custom Ndviz Files

If your `ndviz` installation is already setup to build the `ndviz` client app, you can build a custom `ndviz` application using:

```
python setup.py bundle_client
``` 

in the `ndviz/python` folder. Relatively recent files should be included in the `ndviz` distribution, but we recommend building the client files for the most up-to-date installation.
