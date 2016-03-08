.. NeuroDataViz documentation master file, created by
   sphinx-quickstart on Tue Feb 16 13:53:18 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

NeuroDataViz Documentation
==========================

Web visualization and analysis tool for displaying images and metadata from NeuroData / Open Connectome Project Datastores. Supported imaging modalities include:

* Electron Microscopy
* Array Tomography
* CLARITY
* Calcium Imaging (Time Series)
* X-ray
* Multimodal Magnetic Resonance Imaging

**Features**

* Web based and mobile friendly.
* Share regions of interest by placing a marker and sending colleagues a URL.
* 2D and 3D Time Series support with automated playback controls.
* Basic image processing, including opacity, brightness, contrast, and blending.
* Dynamic metadata support. Query locations from the web interface and add your own metadata (coming soon).

Table of Contents
~~~~~~~~~~~~~~~~~

.. toctree::
   :maxdepth: 2
   :caption: Viewing

   overview.rst

   viewer/index.rst
   viewer/annotations.rst
   viewer/image.rst
   viewer/timeseries.rst
   viewer/adding_data.rst


.. toctree::
  :maxdepth: 2
  :caption: Management

  manage/index.rst
  manage/vizproject.rst
  manage/dataview.rst
