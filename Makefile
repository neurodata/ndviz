INCLUDE = ./build ./server ./config ./bin package.json gruntfile.js LICENSE README.md tsconfig.json ./static ./views tslint.json
APP = ndviz-deploy.zip

all: 
	npm run build; zip -r $(APP) $(INCLUDE) 
	