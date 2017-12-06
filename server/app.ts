import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import * as nunjucks from "nunjucks";
import * as errorHandler from "errorhandler";
import * as methodOverride from "method-override";

import { IndexRoute } from "./routes/index"; 
import { LegacyRoute } from "./routes/legacyRedirect";

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    public app: express.Application;

    /**
     * Bootstrap the application.
     *
     * @class Server
     * @method bootstrap
     * @static
     * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
     */
    public static bootstrap(): Server {
    return new Server();
    }

    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {
    //create expressjs application
    this.app = express();

    //configure application
    this.config();

    //add routes
    this.routes();

    //add api
    this.api();
    }

    /**
     * Create REST API routes
     *
     * @class Server
     * @method api
     */
    public api() {
    //empty for now
    }

    /**
     * Configure application
     *
     * @class Server
     * @method config
     */
    public config() {
        // add static paths 
        this.app.use(express.static(path.join(__dirname, "public")));

        // configure nunjucks 
        nunjucks.configure('views', {
            autoescape: true,
            express   : this.app
          });

        this.app.set("view engine", "html");
        this.app.set("views", path.join(__dirname, "views"));

        // use logger middleware 
        this.app.use(logger("dev"));

        // use josn form parser middleware 
        this.app.use(bodyParser.json());

        // use query string parser middleware 
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        // use cookie parser middleware 
        this.app.use(cookieParser("AJSDUhu1hdjasndQ(@@D@%*!ioashd"));

        // use override middleware 
        this.app.use(methodOverride());
        
        // catch 404 and forward to error handler 
        this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404; 
            next(err);
        });

        this.app.use(errorHandler());
    }

    /**
     * Create router
     *
     * @class Server
     * @method api
     */
    public routes() {
        let router: express.Router; 

        router = express.Router(); 

        IndexRoute.create(router); 
        LegacyRoute.create(router);

        // use router middleware 
        this.app.use(router);
    }
}