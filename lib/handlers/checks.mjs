//----- checks handler, handles request on /checks -----

import config from '../../config.mjs';
import { randomString } from '../helpers.mjs';
import { missingRequiredFields,fieldsValidate } from '../helpers.mjs';
import statusCodes from '../statusCodes.mjs';
import storage from '../storage.mjs';

//----- HTTP POST method on /checks to creates new check -----
//----- HTTP PUT method on /check to updates existing user -----
//----- HTTP GET method on /checks to get existing check information -----
//----- HTTP DELETE method on /check to deletes existing check -----

const maxChecks = config.maxChecks;

let check    = {};
check.POST   = '';
check.PUT    = '';
check.GET    = '';
check.DELETE = '';

function checks(routeData,response) {
    //select user method based on requested http method
    check[routeData.method](routeData,response);
}

//----- HTTP POST, create new url checks -----
//----- required fields: mobileNo, tokenId, -----
//----- checkName, protocol, method, url, successCodes, timeOutSeconds

check.POST = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = checkPostValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError.statusCode;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                        if (err) {
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            if (userObj.noChecks < maxChecks) {
                                //----- verify if check name exists already or not -----
                                if (typeof userObj.checks[cpObj.checkName] == 'undefined') {
                                    userObj.checks[cpObj.checkName] = randomString(30);
                                    userObj.noChecks++;
                                    //----- create check -----
                                    const checkId = userObj.checks[cpObj.checkName];
                                    const checkObj = {
                                        "checkId"       : userObj.checks[cpObj.checkName],
                                        "mobileNo"      : cpObj.mobileNo,
                                        "protocol"      : cpObj.protocol,
                                        "method"        : cpObj.method,
                                        "url"           : cpObj.url,
                                        "successCodes"  : cpObj.successCodes,
                                        "timeOutSeconds" : cpObj.timeOutSeconds,
                                        "status"        : 'up'
                                    };

                                    storage.create('checks',checkId,checkObj,(err) =>{
                                        if (err) {
                                            //----- random string generator collision -----
                                            console.error(err);
                                            const httpStatus = statusCodes.internalServerError.statusCode;
                                            response(httpStatus,statusCodes.internalServerError);
                                        }
                                        else {
                                            //------ check created success, then update user data file
                                            storage.update('users',userObj.mobileNo.toString(),userObj,(err) => {
                                                if (err) {
                                                    console.error(err)
                                                    const httpStatus = statusCodes.internalServerError.statusCode;
                                                    response(httpStatus,statusCodes.internalServerError);
                                                }
                                                else {
                                                    const rsObj = {
                                                        'checkName' : cpObj.checkName,
                                                        'err'       : statusCodes.checkCreated.err,
                                                        'msg'       : statusCodes.checkCreated.msg,
                                                        'statusCode': statusCodes.checkCreated.statusCode
                                                    };
                                                    const httpStatus = statusCodes.checkCreated.statusCode;
                                                    response(httpStatus,rsObj);
                                                }
                                            });
                                        }
                                    });
                                }
                                else {
                                    //----- cpObj.checkName exists as key in checks object -----
                                    const httpStatus = statusCodes.checkNameExistsError.statusCode;
                                    response(httpStatus,statusCodes.checkNameExistsError);
                                }
                            }
                            else {
                                //----- reached max check limit ---
                                const httpStatus = statusCodes.checksMaxLimitError.statusCode;
                                response(httpStatus,statusCodes.checksMaxLimitError);
                            }
                        }
                    });
                }
                else {
                    //----- token expired -----
                    const httpStatus = statusCodes.tokenExpiredError.statusCode;
                    response(httpStatus,statusCodes.tokenExpiredError);
                }

            }
            else {
                //----- tokenId and mobileNo did not match ---
                const httpStatus = statusCodes.invalidCredentialsError.statusCode;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });

}


function checkPostValidate(cpObj,response) {
    const requiredFields = ['mobileNo','tokenId','checkName','protocol','method','url','successCodes','timeOutSeconds'];    
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj    = fieldsValidate(cpObj);
    let tObj = {};

    if (cpObj) {

        for (let field of requiredFields) {
            if (cpObj[field] == false) {
                const httpStatus = statusCodes.invalidFieldsError.statusCode;
                response(httpStatus,statusCodes.invalidFieldsError);
                return false;
            }
            else {  tObj[field] = cpObj[field]; }
        }
        return tObj;
    }
    else {
        console.error('Fields Validation Failed');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
}


//----- HTTP DELETE- deletes and existing check -----
//------ required fields: mobileNo, tokenId, checkName -----

check.DELETE = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = checkDeleteValidate(cpObj,response);
    if (!cpObj) return;

    //----- verify mobileNo and tokenId with expiry -----
    storage.read('tokens',cpObj.tokenId,(err,tokenObj) =>{
        if (err) {
            //----- token does not exits , send invalid token response ----
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError.statusCode;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) =>{
                        if (err) {
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            if (userObj.checks[cpObj.checkName]) {
                                //---- update user data file ---
                                const checkId = userObj.checks[cpObj.checkName];
                                userObj.noChecks--;
                                delete userObj.checks[cpObj.checkName];

                                storage.update('users',userObj.mobileNo.toString(),userObj,(err) => {
                                    if (err) {
                                        console.error(err);
                                        const httpStatus = statusCodes.internalServerError.statusCode;
                                        response(httpStatus,statusCodes.internalServerError);
                                    }
                                    else {
                                        //-- user data file updates, now delete check data file -----
                                        storage.delete('checks',checkId,(err) => {
                                            if (err) {
                                                console.error(err);
                                                const httpStatus = statusCodes.internalServerError.statusCode;
                                                response(httpStatus,statusCodes.internalServerError);
                                            }
                                            else {
                                                const httpStatus = statusCodes.checkDeleted.statusCode;
                                                response(httpStatus,statusCodes.checkDeleted);
                                            }
                                        });
                                    }
                                });
                            }
                            else {
                                const httpStatus = statusCodes.checkNameDoNotExistsError.statusCode;
                                response(httpStatus,statusCodes.checkNameDoNotExistsError)
                            }
                        }
                    });
                }
                else {
                    //----- token expired -----
                    const httpStatus = statusCodes.tokenExpiredError;
                    response(httpStatus,statusCodes.tokenExpiredError);
                }
            }
            else {
                //----- tokenId and mobileNo did not match -----
                const httpStatus = statusCodes.invalidCredentialsError;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });


}

function checkDeleteValidate(cpObj,response) {
 const requiredFields = ['mobileNo','tokenId','checkName'];    
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj    = fieldsValidate(cpObj);
    let tObj = {};

    if (cpObj) {
        for (let field of requiredFields) {
            if (cpObj[field] == false) {
                const httpStatus = statusCodes.invalidFieldsError.statusCode;
                response(httpStatus,statusCodes.invalidFieldsError);
                return false;
            }
            else {  tObj[field] = cpObj[field]; }
        }
        return tObj;
    }
    else {
        console.error('Fields Validation Failed');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
}


//---- HTTP PUT , modify and existing check -----
//---- required fields: mobileNo, tokenId, checkName ----
//----- optional fields: protocol, method, url, successCodes, timeOutSeconds

check.PUT = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = checkPutValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            //----- token does not exits -----
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError.statusCode;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    //----- check if checkName is valid , if valid then update check -----
                    storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                        if (err) {
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            if (typeof userObj.checks[cpObj.checkName] == 'undefined') {
                                //---- checkName Do not exits -----
                                const httpStatus = statusCodes.checkNameDoNotExistsError.statusCode;
                                response(httpStatus,statusCodes.checkNameDoNotExistsError);
                            }
                            else {
                                //----- update check data file -----
                                const checkId = userObj.checks[cpObj.checkName];
                                storage.read('checks',checkId,(err,checkObj) => {
                                    if (err) {
                                        console.error(err);
                                        const httpStatus = statusCodes.internalServerError.statusCode;
                                        response(httpStatus,statusCodes.internalServerError);
                                    }
                                    else {
                                        delete cpObj.mobileNo; delete cpObj.tokenId; delete cpObj.checkName;

                                        for (let field in cpObj) {
                                            checkObj[field] = cpObj[field];
                                        }
                                        storage.update('checks',checkId,checkObj,(err) => {
                                            if (err) {
                                                console.error(err);
                                                const httpStatus = statusCodes.internalServerError.statusCode;
                                                response(httpStatus,statusCodes.internalServerError);
                                            }
                                            else {
                                                //---- check updated success -----
                                                const httpStatus = statusCodes.checkUpdated.statusCode;
                                                response(httpStatus,statusCodes.checkUpdated);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                else {
                    //----- token expired -----
                    const httpStatus = statusCodes.tokenExpiredError.statusCode;
                    response(httpStatus,statusCodes.tokenExpiredError);
                }
            }
            else {
                //----- mobileNo and tokenId did not match -----
                const httpStatus = statusCodes.invalidCredentialsError;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });

}

function checkPutValidate(cpObj,response) {
    const requiredFields = ['mobileNo','tokenId','checkName'];
    const optionalFields = ['protocol','method','url','successCodes','timeOutSeconds'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj = fieldsValidate(cpObj);
    let tObj = {};

    if (cpObj) {
        for (let field of requiredFields) {
            if (cpObj[field] == false) {
                const httpStatus = statusCodes.invalidFieldsError.statusCode;
                response(httpStatus,statusCodes.invalidFieldsError);
                return false;
            }
            else {  tObj[field] = cpObj[field]; }
        }
        for (let field of optionalFields) {
            if (cpObj[field] === false) {
                const httpStatus = statusCodes.invalidFieldsError.statusCode;
                response(httpStatus,statusCodes.invalidFieldsError);
                return false;
            }
            else if (typeof cpObj[field] == 'undefined') { continue; }
            else {
                tObj[field] = cpObj[field];
            }
        }
        return tObj;
    }
    else {
        console.error('Fields Validation Failed');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }   
}

//----- HTTP GET, get information about check ----
//----- required fields: mobileNo, tokenId, checkName ----
//----- checkName: checkname/ namesOnly / getAll -----

check.GET = (routeData,response) => {
    let cpObj = {};
    cpObj.mobileNo = parseInt(routeData.headers.mobileno);
    cpObj.tokenId  = routeData.headers.tokenid;
    cpObj.checkName = routeData.headers.checkname; 

    cpObj = checkGetValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            //----- token does not exits -----
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError.statusCode;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    if (cpObj.checkName === 'getAll') {
                        //----- send all checks info as object, object key name is checkName ----
                        let getAll = {};
                        let c = 0;
                        storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                            if (err) {
                                console.error(err);
                                const httpStatus = statusCodes.internalServerError.statusCode;
                                response(httpStatus,statusCodes.internalServerError);
                            }
                            else {
                                //---- read checkName,checkId from users data file ----
                                //---- read all check data files to object ----
                                let totalKeys = Object.keys(userObj.checks).length;
                                for (let checkName in userObj.checks) {
                                    let checkId = userObj.checks[checkName];
                                    storage.read('checks',checkId,(err,checkObj) => {
                                        if (err) {
                                            console.error(err);
                                            const httpStatus = statusCodes.internalServerError.statusCode;
                                            response(httpStatus,statusCodes.internalServerError);
                                        }
                                        else {
                                            getAll[checkName] = checkObj;
                                            totalKeys--;
                                            if (totalKeys === 0) {
                                                getAll.err        = statusCodes.checkFetched.err;
                                                getAll.msg        = statusCodes.checkFetched.msg;
                                                getAll.statusCode = statusCodes.checkFetched.statusCode; 
                                                const httpStatus  = statusCodes.checkFetched.statusCode;
                                                response(httpStatus,getAll);
                                            }
                                        }
                                    });
                                }
                            }                             
                        });
                    }
                    else if (cpObj.checkName == 'namesOnly') {
                        let namesOnly = {};
                        namesOnly.checkNames = [];

                        storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                            if (err) {
                                console.error(err);
                                const httpStatus = statusCodes.internalServerError.statusCode;
                                response(httpStatus,statusCodes.internalServerError);
                            }
                            else {
                                //---- send checkNames only -----
                                for (let checkName in userObj.checks) {
                                    namesOnly.checkNames.push(checkName);
                                }
                                if (namesOnly) {
                                    namesOnly.err = statusCodes.checkFetched.err;
                                    namesOnly.msg = statusCodes.checkFetched.msg;
                                    namesOnly.statusCodes = statusCodes.checkFetched.statusCode;

                                    const httpStatus = statusCodes.checkFetched.statusCode;
                                    response(httpStatus,namesOnly);
                                }   
                                else {
                                    const httpStatus = statusCodes.internalServerError.statusCode;
                                    response(httpStatus,statusCodes.internalServerError);
                                }
                            }
                        });
                    }
                    else {
                        storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                            if (err) {
                                console.error(err);
                                const httpStatus = statusCodes.internalServerError.statusCode;
                                response(httpStatus,statusCodes.internalServerError);
                            }
                            else {
                                const checkId = userObj.checks[cpObj.checkName];
                                storage.read('checks',checkId,(err,checkObj) => {
                                    if (err) {
                                        console.error(err);
                                        const httpStatus = statusCodes.internalServerError.statusCode;
                                        response(httpStatus,statusCodes.internalServerError);
                                    }
                                    else {
                                        checkObj.err        = statusCodes.checkFetched.err;
                                        checkObj.msg        = statusCodes.checkFetched.msg;
                                        checkObj.statusCode = statusCodes.checkFetched.statusCode;

                                        const httpStatus = statusCodes.checkFetched.statusCode;
                                        response(httpStatus,checkObj);
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    //----- token expired ----
                    const httpStatus = statusCodes.tokenExpiredError.statusCode;
                    response(httpStatus,statusCodes.tokenExpiredError);
                }
            }
            else {
                //---- mobileNo and tokenId did not match -----
                const httpStatus = statusCodes.invalidCredentialsError.statusCode;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });
}

function checkGetValidate(cpObj,response) {
    const requiredFields = ['mobileNo','tokenId','checkName'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj = fieldsValidate(cpObj);
    let tObj = {};

    if (cpObj) {
        for (let field of requiredFields) {
            if (cpObj[field] == false) {
                const httpStatus = statusCodes.invalidFieldsError.statusCode;
                response(httpStatus,statusCodes.invalidFieldsError);
                return false;
            }
            else {  tObj[field] = cpObj[field]; }
        }
        return tObj;
    }
    else {
        console.error('Fields Validation Failed');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }  

}

export default checks;