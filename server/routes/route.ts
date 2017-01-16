import { NextFunction, Request, Response } from "express";

/**
 * Constructor 
 */
export class BaseRoute {
    protected title: string; 

    private scripts: string[]; 

    /**
     * Constructor
     */
    constructor() {
        // initialize variables 
        this.title = "NeuroDataViz";
        this.scripts = []; 
    }

    /** 
     * Add JS external file (??)
     */
    public addScript(src: string): BaseRoute {
        this.scripts.push(src);
        return this; 
    }

    /** 
     * Render a page 
     */
    public render(req: Request, res: Response, view: string, options?: Object) {
        // add constants 
        res.locals.BASE_URL = "/";

        // add scripts 
        res.locals.scripts = this.scripts; 

        // add title 
        res.locals.title = this.title; 

        // render 
        res.render(view, options); 

    }
}
