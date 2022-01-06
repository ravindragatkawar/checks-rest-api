//---- index.mjs file of lib/handlers -----
let handler = {};

import handler  from './users.mjs';



//----- handlers imported to handle client specified request/route -----

//let handler = {};

handler.ping = (routeData,response) => {
    response(200,{ 'err':0, 'msg':'pong' });          
}

handler.notFound = (routeData,response) => {
    response(404,{ 'err':1, 'msg':'Page Not Found'});
}

handler.user = users;

//----- mapping trimmedPath's and respective handlers

const routes = {
    'ping' : handler.ping,
    'users': handler.user
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