import http from 'http';
import https from 'https';
import { parse } from 'url';
import { StringDecoder } from 'string_decoder';
import { passToHandler } from './handlers/index.mjs';


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
        res.writeHead(405);
        res.end(`Method Not Allowed, Only ${allowedMethods} Allowed`);
    }
    else {       
    //---- get client request information and pass it to request handlers -----    
        
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
            'clientPayload': ''
        };

        //----- data encoding/decoding , assuming client also uses utf-8 encoding -----
        const decoder = new StringDecoder('utf-8');

        //----- receive any payload sent by client in body -----
        //----- stream event req.on('data',(data)=> {}) to get data -----
        //----- stream event req.end('end',()=> {}) at end of data -----
        
        req.on('data',(data) => {
            routeData.clientPayload += decoder.write(data);
        });
        req.on('end',() => {
            routeData.clientPayload += decoder.end();

            //----- pass to request handler -----
            passToHandler(req,res,routeData);
        });
    }
}



export default app;