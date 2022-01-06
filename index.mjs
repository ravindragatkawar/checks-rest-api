//----- entry file for app -----

import app from './lib/app.mjs';
import config from './config.mjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname,join } from 'path/posix';


const envName   = config.envName.toUpperCase();
const httpPort  = config.httpPort;
const httpsPort = config.httpsPort;

const __dirname = dirname(fileURLToPath(import.meta.url));  // get current working directory 
console.log(`App Started In ${envName}`);


//----- start http, https server -----

app.http(httpPort);

const httpsOptions ={
    'key' : readFileSync(join(__dirname,'ssl/server.key')),
    'cert': readFileSync(join(__dirname,'ssl/server.crt'))
}
app.https(httpsOptions,httpsPort);
