# NeuroDataViz v2.0 Beta

Web visualization and analysis for neuroimaging datasets. Powered by [Neuroglancer](github.com/google/neuroglancer).

## Features 

In addition to most current Neuroglancer features, NDViz adds...

* False coloring and Min/max intensity correction controls.
* Variable blend modes (press `h` to bring up the help menu that lists the corresponding keyboard shortcut).
* Single-channel overlays -- overlay two different z-indices of the same channel.

## Browsers

NDViz v2 is compatible with recent versions of Google Chrome and Mozilla Firefox. The Apple Safari Technology Preview seems to mostly work, but current versions of Safari do not fully support certain Javascript functionality that NDViz requires. 

## Installation 

**A note about CORS**: NDViz v2 loads data from remote sources into browser memory. Therefore, remote servers require CORS headers. For more information on CORS and configuring servers to allow remote loading of resources by adding the appropriate CORS headers, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS.

The installation intructions below will setup NDViz for development and testing purposes. For production use, we recommend placing a nginx proxy in front of the built-in nodejs web server. There are many tutorials available, and configurations may need to be adapated for specific usecases. However, [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04#set-up-nginx-as-a-reverse-proxy-server) is a good starting point. 

1. Install [nodejs and npm](https://docs.npmjs.com/getting-started/installing-node).
2. Download the NeuroDataViz source (e.g. `git clone https://github.com/neurodata/ndviz.git`)
3. Download the Neuroglancer source. You will want to use the `ndmaster` branch from the [Neurodata fork](https://github.com/neurodata/neuroglancer) of Neuroglancer.
4. Enter the `neuroglancer` directory. Run `npm install`.
5. From the same directory, run `npm link`. 
6. Switch to the `ndviz` directory. Run `npm install`.
7. Run `npm link neuroglancer`
8. Run `npm run build`. (For development, you may want to run `npm run watch` as a background process). This sets up the client-facing viewer code. 
9. Finally, run `npm start`. By default, `npm start` will use port 80, which requires root privileges on most systems. To run on port 8000, use `npm run start-dev`. 

**Note**: You will need to restart the server each time code changes while in development mode. 