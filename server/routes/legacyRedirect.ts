import { NextFunction, Request, Response, Router } from "express";
import { RedirectRoute } from "./route";

/** 
 * Legacy render redirect 
 */
export class LegacyRoute extends RedirectRoute {
    public static create(router: Router) {
        console.log("[RedirectRoute::create] Creating render legacy route.");

        // ABTODO 
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
        let source: string = `render://http://${JSON.stringify(req.params['server'])}/${JSON.stringify(req.params['owner'])}/${JSON.stringify(req.params['project'])}/${JSON.stringify(req.params['stack'])}`;

        source = source.replace(/\"/g, '');

        let layer: Object = {
            'type': 'image',
            'source': source
        }

        let layerParent: Object = { 'layer1' : layer }

        let params: Object = {
            'layers': layerParent
        }
        let newUrl = `/#!${JSON.stringify(params)}`;

        this.redirect(req, res, newUrl, 302); 
    }
}