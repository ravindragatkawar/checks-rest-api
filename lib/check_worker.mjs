import storage from "./storage.mjs";
import { parse } from "url";
import http from 'http';
import https from 'https';

export function checkWorkerInit() {
    checkWorker();
}


function checkWorker() {
    //----- read all files in .data/checks without .json-----
    setInterval(() => {
        storage.list('checks',(err,checkObj) => {
            if (!err && checkObj) {
                checkStatus(checkObj,sendAlert);
            }
            else {
                console.error(err);
            }
        });
    },1000*60);
}

//------ checks status of site ----
function checkStatus(checkObj,callback) {
    const urlToParse = checkObj.protocol+'://'+checkObj.url;
    const parsedUrl = parse(urlToParse,true);

    const requestDetails = {
        'hostname' : 'www.'+parsedUrl.hostname,
        'path'     : parsedUrl.path,
        'protocol' : checkObj.protocol+':',
        'method' : checkObj.method.toUpperCase(),
        'timeout' : parseInt(checkObj.timeOutSeconds*1000) 
    };

    //----- create request
    const moduleToUse = checkObj.protocol === 'http'? http : https;

    const req = moduleToUse.request(requestDetails,(res) => {
        let status = res.statusCode;
        if (status === 200 || status === 201) {
            checkObj.currentStatus = 'up';
            callback(checkObj)
        }
        else {
            checkObj.currentStatus = 'down';
            callback(checkObj)
        }
    });
    //--- bind request ----
    req.on('error',(err) => {
        console.error(err);
    });
    //----- end request, send request----
    req.end();

}


//-----@TODO add Twilio SMS sender ----

function sendAlert(checkObj) {
    if (checkObj.status !== checkObj.currentStatus) {
       console.log(checkObj.url+ '\tis\t'+checkObj.status+'\tnow');
       
       checkObj.status = checkObj.currentStatus;
       delete checkObj.currentStatus;
       storage.update('checks',checkObj.checkId,checkObj,(err)=>{});
   }
}