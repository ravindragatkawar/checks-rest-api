import http from 'http';
import https from 'https';



//----- app, create and start http, https server

let app = {};

app.http = (httpPort) => {
    const httpServer = http.createServer((req,res) => {
        
    });
    httpServer.listen(httpPort,() => {
        console.log('HTTP Server Started On Port:',httpPort);
    });
}

app.https = (httpsOptions,httpsPort) => {
    const httpsServer = https.createServer(httpsOptions,(req,res) => {

    }); 
    httpsServer.listen(httpsPort,() => {
        console.log('HTTPS Server Started On Port:',httpsPort);
    });
}