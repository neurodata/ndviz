import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";

/** 
 * Route user 
 */
export class IndexRoute extends BaseRoute {
    public static create(router: Router) {
        console.log("[IndexRoute::create] Creating index route.");

        router.get("/", (req: Request, res: Response, next: NextFunction) => {
            new IndexRoute().index(req, res, next);
        });
    }

    constructor() {
        super(); 
    }

    /** 
     * Home page route 
     */
    public index(req: Request, res: Response, next: NextFunction) {
        this.title = "Home | NeuroDataViz";

        let options: Object = {
            "message": "Welcome to NeuroDataViz"
        };

        this.render(req, res, "index", options); 
    }
}