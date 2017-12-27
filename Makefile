INCLUDE = ./build ./server ./config ./bin package.json gruntfile.js LICENSE README.md tsconfig.json ./static tslint.json
APP = ndviz-deploy.zip

all: 
	npm run build-min; zip -r $(APP) $(INCLUDE) 
	
