//---- main file for app, exports to entry file index.mjs -----

import http from 'http';
import https from 'https';
import { parse } from 'url';
import { StringDecoder } from 'string_decoder';
import { passToHandler } from './handlers/index.mjs';
import { jsonParse } from './helpers.mjs';


//----- app, create and start http, https server

let app = {};

app.http = (httpPort) => {
    const httpServer = http.createServer((req,res) => {
        basicHttpOperation(req,res);
    });
    httpServer.listen(httpPort,() => {
        console.log('HTTP Server Started On Port:',httpPort);
    });
}

app.https = (httpsOptions,httpsPort) => {
    const httpsServer = https.createServer(httpsOptions,(req,res) => {
        basicHttpOperation(req,res);
    }); 
    httpsServer.listen(httpsPort,() => {
        console.log('HTTPS Server Started On Port:',httpsPort);
    });
}


//----- do basic http operations -----

function basicHttpOperation(req,res) {
    const allowedMethods = ['POST','PUT','GET','DELETE'];
    
    //----- check if client reqested http method is allowd or not -----
    
    if (allowedMethods.indexOf(req.method) < 0) {
        const rsFail = {'err':1, 'msg': `Method Not Allowed, Only ${allowedMethods} Allowed`};
        res.setHeader('Content-Type','application/json');
        res.writeHead(405);
        res.end(JSON.stringify(rsFail));
    }
    else {       
    //---- get client request information and pass it to request handlers -----    
        
        //----- data encoding/decoding , assuming client also uses utf-8 encoding -----
        const decoder = new StringDecoder('utf-8');

        //----- receive any payload sent by client in body -----
        //----- stream event req.on('data',(data)=> {}) to get data -----
        //----- stream event req.end('end',()=> {}) at end of data -----
        let clientPayload = '';

        req.on('data',(data) => {
            clientPayload += decoder.write(data);
        });
        req.on('end',() => {
            clientPayload += decoder.end();

            const parsedUrl = parse(req.url,true);
            const trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");    
            const method = req.method;
            const headers = req.headers;
            const queryObj = parsedUrl.query;
    
            let routeData = {
                'method'       : method,
                'headers'      : headers,
                'queryObj'     : queryObj,
                'trimmedPath'  : trimmedPath,
            };

            //----- check if client sent any payload, if sent then verify that it's valid json string -----
            
            if (clientPayload) {
                const clientPayloadObj = jsonParse(clientPayload);
                if (clientPayloadObj) {
                    routeData.clientPayload = clientPayloadObj;
                    //----- pass to request handler -----
                    passToHandler(req,res,routeData);
                }
                else {
                    const rsFail = {'err':1, 'msg':'Invalid JSON String Provided'};
                    res.setHeader('Content-Type','application/json');
                    res.writeHead(405);
                    res.end(JSON.stringify(rsFail));
                }
            }
            else {
                //----- pass to request handler -----
                passToHandler(req,res,routeData);
            }
        });
    }
}



export default app;