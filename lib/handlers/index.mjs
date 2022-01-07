//---- index.mjs file of lib/handlers -----

//----- handlers imported to handle client specified request/route -----
import handler  from './handlers.mjs';



//----- mapping trimmedPath's and respective handlers

const routes = {
    'ping' : handler.ping,
    'users': handler.users
}   


//----- select appropriate handler based on client request path -----
//----- if there is not handler for requested path in routes ----
//----- then use handler.notFound as default error -----

export function passToHandler(req,res,routeData) {
    const path = routeData.trimmedPath;
    let selectedHandler = {}

    selectedHandler = typeof routes[path] !== 'undefined'? routes[path] : handler.notFound; 

    selectedHandler(routeData,(statusCode,serverPayload) => {
           statusCode    = typeof statusCode == 'number'? statusCode : 200;
           serverPayload = typeof serverPayload == 'object'? serverPayload : {};
        const payloadStr = JSON.stringify(serverPayload); 

        res.setHeader('Content-Type','application/json');
        res.writeHead(statusCode);
        res.end(payloadStr);
    });
}