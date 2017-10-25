FROM node:8.7-slim

# Update container and install packages 
RUN apt-get update 
RUN apt-get -y upgrade 

# Install packages 
RUN apt-get -y install git 

# Install webpack and webpack-dev-server globally
RUN npm install -g webpack@^3.5.5
RUN npm install -g webpack-dev-server@^2.2.0

# Install neuroglancer from neurodata source 
WORKDIR /usr/src 
RUN git clone https://github.com/neurodata/neuroglancer.git 

WORKDIR /usr/src/neuroglancer 
RUN git checkout ndmaster
RUN git pull 

RUN npm install 
RUN npm link 

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Link neuroglancer and install ndviz dependencies
COPY package.json /usr/src/app/
RUN npm install
# Bundle app source
COPY . /usr/src/app

RUN npm link neuroglancer 

# Compile typescript and copy files 
RUN npm run build 
RUN npm run grunt 

CMD [ "npm", "start" ]

EXPOSE 8080
