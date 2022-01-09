//------ tokens handler handlers requests to /tokens ------

import { hashPassword } from "../helpers.mjs";
import { missingRequiredFields,fieldsValidate,randomString } from "../helpers.mjs";
import storage from "../storage.mjs";
import statusCodes from '../statusCodes.mjs';


//----- HTTP POST on /tokens create new tokens and sends token info -----
//----- HTTP PUT on /tokens updates existing tokens and sends token info -----
//----- HTTP DELETE on /tokens deletes existing tokens -----
//----- HTTP GET on /tokens and sends token information -----

let token    = {};
token.POST   = '';
token.PUT    = '';
token.GET    = '';
token.DELETE = '';


function tokens(routeData,response) {
    //select user method based on requested http method
    token[routeData.method](routeData,response);
}

const invalidFields = {'err':1, 'msg':'Invalid Fields Sent'}

//----- HTTP POST on /tokens create new tokens and sends token info -----
//----- required fields : mobileNo, password -----

token.POST = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = tokenPostValidate(cpObj,response);
    if (!cpObj) return;

    //-----generate new token first, if error the tokenId collision respond with server error -----
    let tokenObj = {};
    tokenObj.mobileNo = cpObj.mobileNo;
    tokenObj.tokenId  = randomString(20);
    tokenObj.tokenExpiry = Date.now() + 1000*60*60;
    
    storage.create('tokens',tokenObj.tokenId,tokenObj,(err) => {
        if (err) {
            //----- random token generator collision -----
            console.error(err);
            const httpStatus = statusCodes.internalServerError.statusCode;
            response(httpStatus,statusCodes.internalServerError);
        }
        else {
            //----- read user and verify if password matches or not -----
            storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                if (err) {
                    //---- user don't exists, delete generated token and send error -----
                    console.error(err);
                    storage.delete('tokens',tokenObj.tokenId,(err) => {
                        if (err) {
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            const httpStatus = statusCodes.userDoNotExistsError.statusCode;
                            response(httpStatus,statusCodes.userDoNotExistsError);
                        }
                    });
                }
                else {
                    cpObj.password = hashPassword('sha256',cpObj.password);
                    
                    if (cpObj.password === userObj.password) {
                        //------ update user data file with new tokenId -----
                        const oldTokenId = userObj.tokenId;
                        userObj.tokenId  = tokenObj.tokenId;

                        storage.update('users',userObj.mobileNo.toString(),userObj,(err) => {
                            if (err) {
                                console.error(err); 
                                const httpStatus = statusCodes.internalServerError.statusCode;
                                response(httpStatus,statusCodes.internalServerError);
                            }
                            else {
                                const rsObj = {
                                    'mobileNo'    : tokenObj.mobileNo,
                                    'tokenId'     : tokenObj.tokenId,
                                    'tokenExpiry' : tokenObj.tokenExpiry,
                                    'err'         : statusCodes.tokenCreated.err, 
                                    'msg'         : statusCodes.tokenCreated.msg,
                                    'statusCode'  : statusCodes.tokenCreated.statusCode
                                };

                                const httpStatus = statusCodes.tokenCreated.statusCode;
                                response(httpStatus,rsObj);
                            }
                        });
                        //----- delete oldTokenId -----
                        storage.delete('tokens',oldTokenId,(err) => {
                            if (err) { console.error(err); }
                        });                      
                    }
                    else {
                        //----- user's password did not match -----
                        const httpStatus = statusCodes.invalidCredentialsError.statusCode;
                        response(httpStatus,statusCodes.invalidCredentialsError)
                    }
                }
            });
        }
    });
}   


function tokenPostValidate(cpObj,response) {
    const requiredFields = ['mobileNo','password'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    //----- validate client payload according to constraints -----
    //----- and also discard if any extra fields are sent by client -----
    cpObj = fieldsValidate(cpObj);

        //----- verify if all required fields are true -----
    if (cpObj) {
        if (cpObj.mobileNo && cpObj.password) {
            let userObj = {
                'mobileNo' : cpObj.mobileNo,
                'password' : cpObj.password
            }
            return userObj;
        }
        else {
            response(400,invalidFields);
            return false;
        }

    }
    else {
        console.error('Error Failure in Fields Validation');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
}


//----- PUT updates the existing tokenExpiry by 1 hour from NOW-----
//----- required fields: tokenId, mobileNo -----

token.PUT = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = tokenPutValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError.statusCode;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo == tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    tokenObj.tokenExpiry = Date.now() + 1000*60*60;

                    storage.update('tokens',tokenObj.tokenId,tokenObj, (err) => {
                        if (err) {
                            //----- tokenExpiry extend failed, internal error -----
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            //--- tokenExpiry extended -----
                            const rsObj = {
                                'tokenExpiry' : tokenObj.tokenExpiry,
                                'err'         : statusCodes.tokenExpiryExtended.err, 
                                'msg'         : statusCodes.tokenExpiryExtended.msg,  
                                'statusCode'  : statusCodes.tokenExpiryExtended.statusCode
                            };
                            const httpStatus = statusCodes.tokenExpiryExtended.statusCode;
                            response(httpStatus,rsObj);
                        }
                    });

                }   
                else {
                    //----- token expired ----
                    const httpStatus = statusCodes.tokenExpiredError.statusCode;
                    response(httpStatus,statusCodes.tokenExpiredError);
                }
            }
            else {
                //----- mobileNo did not match with TokenId
                const httpStatus = statusCodes.invalidCredentialsError.statusCode;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });
}

function tokenPutValidate(cpObj,response) {
    const requiredFields = ['mobileNo','tokenId','extend'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj = fieldsValidate(cpObj);
    
    if (cpObj) {
        if (cpObj.mobileNo && cpObj.tokenId && cpObj.extend) {
            const tObj = {
                'mobileNo' : cpObj.mobileNo,
                'tokenId'  : cpObj.tokenId,
                'extend'   : cpObj.extend
            };
            return tObj;
        }
        else {
            const httpStatus = statusCodes.invalidFieldsError.statusCode;
            response(httpStatus,statusCodes.invalidFieldsError);
            return false;
        }
    }
    else {
        console.error('Fields Validation Failed');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
    
}


//----- GET sends token information  -----
//----- required Fields: mobileNo, tokenId -----

token.GET = (routeData,response) => {
    let cpObj = {};
    cpObj.mobileNo = parseInt(routeData.headers.mobileno);
    cpObj.tokenId  = routeData.headers.tokenid;

    cpObj = tokenGetValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            //----- token does not exits, invalid tokenId
            console.error(tokenObj);
            const httpStatus = statusCodes.invalidTokenError.statusCode;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    const rsObj = {
                        'tokenId'      : tokenObj.tokenId,
                        'tokenExpiry'  : tokenObj.tokenExpiry,
                        'err'          : statusCodes.tokenFetched.err,
                        'msg'          : statusCodes.tokenFetched.msg,
                        'statusCode'   : statusCodes.tokenFetched.statusCode
                    };
                    const httpStatus = statusCodes.tokenFetched.statusCode;
                    response(httpStatus,rsObj);
                }
                else {
                    //----- token expired -----
                    const httpStatus = statusCodes.tokenExpiredError.statusCode;
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

function tokenGetValidate(cpObj,response) {
    const requiredFields = ['mobileNo','tokenId'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj = fieldsValidate(cpObj);
    
    if (cpObj) {
        if (cpObj.mobileNo && cpObj.tokenId) {
            const tObj = {
                'mobileNo' : cpObj.mobileNo,
                'tokenId'  : cpObj.tokenId,
            };
            return tObj;
        }
        else {
            const httpStatus = statusCodes.invalidFieldsError.statusCode;
            response(httpStatus,statusCodes.invalidFieldsError);
            return false;
        }
    }
    else {
        console.error('Fields Validation Failed');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
}

//----- DELETE, deletes users token -----
//----- required fields: mobileNo, tokenId -----

token.DELETE = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = tokenDeleteValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError.statusCode;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                //----- set tokenId from user data file to empty -----
                storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                    if (err) {
                        console.error(err);
                        const httpStatus = statusCodes.internalServerError.statusCode;
                        response(httpStatus,statusCodes.internalServerError);
                    }
                    else {
                        userObj.tokenId = '';
                        storage.update('users',userObj.mobileNo.toString(),userObj,(err) => {
                            if (err) {
                                console.error(err);
                                const httpStatus = statusCodes.internalServerError.statusCode;
                                response(httpStatus,statusCodes.internalServerError);
                            }
                            else {
                                //----- user's data files tokenId sent to empty -----
                                //------ delete token data file of user -----
                                storage.delete('tokens',tokenObj.tokenId,(err) => {
                                    if (err) {
                                        const httpStatus = statusCodes.internalServerError;
                                        response(httpStatus,statusCodes.internalServerError);
                                    }
                                    else {
                                        const httpStatus = statusCodes.tokenDeleted.statusCode;
                                        response(httpStatus,statusCodes.tokenDeleted);
                                    }
                                });
                            }
                        });
                        
                    }
                });
            }
            else {
                //----- tokenId and mobileNo did not match -----
                const httpStatus = statusCodes.invalidCredentialsError;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }                    
    });
}

function tokenDeleteValidate(cpObj,response) {
    const requiredFields = ['mobileNo','tokenId'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;
    
    cpObj = fieldsValidate(cpObj);

    if (cpObj) {
        if (cpObj.mobileNo && cpObj.tokenId) {
            const tObj = {
                'mobileNo' : cpObj.mobileNo,
                'tokenId'  : cpObj.tokenId
            };
            return tObj;
        }
        else {
            const httpStatus = statusCodes.invalidFieldsError.statusCode;
            response(httpStatus,statusCodes.invalidFieldsError);
            return false;
        }
    }
    else {
        console.error('Fields Validation Failed');
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
    
}


export default tokens;

