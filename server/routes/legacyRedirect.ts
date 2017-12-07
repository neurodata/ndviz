import { NextFunction, Request, Response, Router } from "express";
import { RedirectRoute } from "./route";

interface Layer {
    type: string;
    source: string;
    blend?: string;
}

interface LayerObject {
    [key: string]: Object;
}

/** 
 * Legacy render redirect 
 */
export class LegacyRoute extends RedirectRoute {
    public static create(router: Router) {
        console.log("[RedirectRoute::create] Creating render legacy route.");

        router.get("/render/:server/:owner/:project/:stack/(:plane/:res/:x/:y/:z/)?*", (req: Request, res: Response, next: NextFunction) => {
            new LegacyRoute().renderRoute(req, res, next);
        });
    }

    constructor() {
        super(); 
    }

    /** 
     * Redirect ndviz v1 render URL format 
     * render/172.17.0.1:8080/demo/example_1/v1_acquire/
     */
    public renderRoute(req: Request, res: Response, next: NextFunction) {
        
        let renderSourceParams = `${JSON.stringify(req.params['owner'])}/${JSON.stringify(req.params['project'])}/${JSON.stringify(req.params['stack'])}`;
        if (req.query['channel']) {
            renderSourceParams = `${renderSourceParams}/${JSON.stringify(req.query['channel'])}`;            
        }
        
        let renderSourceServer = `${JSON.stringify(req.params['server'])}`;

        let source: string;
        if (req.query['ssl']) {
            source = `render://https://${renderSourceServer}/${renderSourceParams}`;
        } else {
            source = `render://http://${renderSourceServer}/${renderSourceParams}`;
        }

        source = source.replace(/\"/g, '');

        let layer: Layer = {type: 'image', source: source};

        if (req.query['blend'] !== undefined) {
            layer.blend = req.query['blend'];
        }

        let layerParent: LayerObject = {}; 
        layerParent[req.params['stack']] = layer; 

        let params: Object = {
            'layers': layerParent
        }
        let newUrl = `/#!${JSON.stringify(params)}`;
        console.log(newUrl);
        this.redirect(req, res, newUrl, 302); 
    }
}