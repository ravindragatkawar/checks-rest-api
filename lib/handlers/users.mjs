//----- users handler, handles request on /users -----

import { missingRequiredFields } from "../helpers.mjs";
import { randomString } from "../helpers.mjs";
import { hashPassword } from "../helpers.mjs";
import { fieldsValidate } from "../helpers.mjs";
import storage from '../storage.mjs';
import statusCodes from '../statusCodes.mjs';

//----- HTTP POST method on /users to create new user -----
//----- HTTP PUT method on /users to update existing user -----
//----- HTTP GET method on /users to get existing user information -----
//----- HTTP DELETE method on /users to delete existing user -----

let user    = {};
user.POST   = '';
user.PUT    = '';
user.GET    = '';
user.DELETE = '';

function users(routeData,response) {
    //select user method based on requested http method
    user[routeData.method](routeData,response);
}


//-----POST - create new user , error if user exists -----
//----- required fields: mobileNo, firstName, lastName, password, email, tnc

user.POST = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = userPostValidate(cpObj,response);
    if (!cpObj) return;
    
    cpObj.password = hashPassword('sha256',cpObj.password);
    cpObj.tokenId  = randomString(20);
    
    //----- create token data first, to avoid random tokenId collision with existing users -----
    //----- if generated tokenId exits, respond with error to retry ----
    let tokenObj = {};
    tokenObj.mobileNo    = cpObj.mobileNo;
    tokenObj.tokenId     = cpObj.tokenId;
    tokenObj.tokenExpiry = Date.now() + 1000*60*60;

    storage.create('tokens',tokenObj.tokenId,tokenObj,(err) => {
        if (err) {
            //----- random generated tokenId collision, tokenId is associated with existing user -----
            console.error(err);
            const httpStatus = statusCodes.internalServerError.statusCode;
            response(httpStatus,statusCodes.internalServerError);
        }
        else {
            //----- no tokenId collision, create user -----
            let userObj      = cpObj;
            userObj.noChecks = 0;
            userObj.checks   = {};
            const mobileNoStr = userObj.mobileNo.toString();

            storage.create('users',mobileNoStr,userObj,(err) => {
                if (err) {
                    //----- error, user already exits -----
                    console.error(err);
                   //----- delete above token created -----
                    storage.delete('tokens',tokenObj.tokenId,(err) => {
                        if (err) { 
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            const httpStatus = statusCodes.userExistsError.statusCode;
                            response(httpStatus,statusCodes.userExistsError);   
                        }
                    });
                }
                else {
                    //----- user created successfully -----
                    const httpStatus = statusCodes.userCreated.statusCode;
                    const rsObj = {
                        'err'        : statusCodes.userCreated.err,
                        'msg'        : statusCodes.userCreated.msg,
                        'statusCode' : statusCodes.userCreated.statusCode,
                        'mobileNo'   : tokenObj.mobileNo,
                        'tokenId'    : tokenObj.tokenId,
                        'tokenExpiry': tokenObj.tokenExpiry
                    };
                    response(httpStatus,rsObj);
                }
            });
        }
    });
}


function userPostValidate(cpObj,response) {
    const requiredFields = ['mobileNo','email','firstName','lastName','password','tnc'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    //----- validate client payload according to constraints -----
    cpObj = fieldsValidate(cpObj);

    //----- verify if all required fields are true -----
    if (cpObj) {
        if (cpObj.mobileNo && cpObj.email && cpObj.firstName && cpObj.lastName && cpObj.password && cpObj.tnc) {
            let userObj = {};
            //----- discard if any extra fields are sent by client -----
            for (let field of requiredFields) {
                userObj[field] = cpObj[field];
            }
            return userObj;
        }
        else {
            const httpStatus = statusCodes.invalidFieldsError.statusCode;
            response(httpStatus,statusCodes.invalidFieldsError);
            return false;
        }
    }
    else {
        console.error(statusCodes.internalServerError);
        const httpStatus = statusCodes.internalServerError;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
}


//----- GET send user information, error if user doesn't exists
//----- required fields: mobileNo and tokenId -----

user.GET = (routeData,response) => {
    let cpObj = userGetValidate(routeData,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            //---- error tokenId does not exits, but send invalid token response ----
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            //----- tokenId exists, verify if assocaited mobileNo is same as send by client -----
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                //------ and if true , check if token is not expired to proceed -----
                if (tokenObj.tokenExpiry > Date.now()) {
                    const mobileNoStr = tokenObj.mobileNo.toString();

                    storage.read('users',mobileNoStr,(err,userObj) => {
                        if (err) {
                            //----- data read error by server -----
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            const rsObj = {
                                'err' : statusCodes.userFetched.err,
                                'msg' : statusCodes.userFetched.msg,
                                'statusCode' : statusCodes.userFetched.statusCode,
                                "mobileNo" : userObj.mobileNo,
                                "email"    : userObj.email,
                                "firstName": userObj.firstName,
                                "checks"   : userObj.checks,
                                "lastName" : userObj.lastName
                            }
                            response(200,rsObj);
                        }
                    });
                }
                else {
                    //----- token expired error -----
                    const httpStatus = statusCodes.tokenExpiredError;
                    response(httpStatus,statusCodes.tokenExpiredError);
                }
            }
            else {
                //----- tokenId and MobileNo did not match -----
                const httpStatus = statusCodes.invalidCredentialsError.statusCode; 
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });
}


function userGetValidate(routeData,response) {
    const requiredFields = ['mobileNo','tokenId'];
    let cpObj = {};
    cpObj.mobileNo = parseInt(routeData.headers.mobileno);
    cpObj.tokenId  = routeData.headers.tokenid;

    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj = fieldsValidate(cpObj);
    if (cpObj) {
        if (cpObj.mobileNo && cpObj.tokenId) {
            //----- discard extra fields sent by client
            const userObj = {
                'mobileNo' : cpObj.mobileNo,
                'tokenId' : cpObj.tokenId
            }
            return userObj;
        }
        else {
            const httpStatus = statusCodes.invalidFieldsError.statusCode;
            response(httpStatus,statusCodes.invalidFieldsError)
            return false;
        }
    }
    else {
        console.error('Fields Validate Function Error')
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false
    }
    
}


//----- DELETE , deletes and existing user, error if user doesn't exists -----
//----- required fields: mobileNo and password -----

user.DELETE = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = userDeleteValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('users',cpObj.mobileNo.toString(),(err,userObj) => {
        if (err) {
            //----- error, user don't exists to delete  -----
            console.error(err);
            const httpStatus = statusCodes.userDoNotExistsError.statusCode;
            response(httpStatus,statusCodes.userDoNotExistsError);
        }
        else {
            cpObj.password = hashPassword('sha256',cpObj.password);
            if (cpObj.password === userObj.password) {
                //----- delete token data file -----
                storage.delete('tokens',userObj.tokenId,(err) => {
                    if (err) {
                        //----- error deleting token ----
                        console.log(err);
                        const httpStatus = statusCodes.internalServerError.statusCode;
                        response(httpStatus,statusCodes.internalServerError);;
                    }
                    else {
                        //----- delete user checks  -----
                        for (let check of userObj.checks) {
                            storage.delete('checks',check,(err) => {
                                if (err) {
                                    //---- error deleting user checks -----
                                    console.error(err);
                                    const httpStatus = statusCodes.internalServerError.statusCode;
                                    response(httpStatus,statusCodes.internalServerError);
                                    return;
                                }
                            });
                        }
                        //----- delete user -----
                        storage.delete('users',userObj.mobileNo,(err) => {
                            if (err) {
                                //----- error deleting user ----
                                console.log(err);
                                const httpStatus = statusCodes.internalServerError.statusCode;
                                response(httpStatus,statusCodes.internalServerError);
                            }
                            else {
                                const httpStatus = statusCodes.userDeleted.statusCode;
                                response(httpStatus,statusCodes.userDeleted);
                            }
                        });
                    }
                });
            }
            else {
                //----- passwords did not match -----
                const httpStatus = statusCodes.invalidCredentialsError.statusCode;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });
}

function userDeleteValidate(cpObj,response) {
    const requiredFields = ['mobileNo','password'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj = fieldsValidate(cpObj);
    if (cpObj) {
        if (cpObj.mobileNo && cpObj.password) {
            const tObj = {
                'mobileNo': cpObj.mobileNo,
                'password': cpObj.password 
            };
            return tObj;
        }
        else {
            response(400,invalidFields);
        }
    }
    else {
        response(500,{'err':1, 'msg':'Field Validation Failed'});
        return false;
    }
}


//----- PUT, updates an existing user, error if user don't exits -----
//----- required fields: mobileNo, tokenId ------
//----- optional fields: firstName, lastName, email, password, newMobileNo


user.PUT = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = userPutValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            //----- error token data not fount but still sent conflict 409, instead of 404 not found
            console.error(err);
            const httpStatus = statusCodes.invalidTokenError;
            response(httpStatus,statusCodes.invalidTokenError);
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    storage.read('users',cpObj.mobileNo.toString(),(err,userObj) => {
                        if (err) {
                            //---- error reading user data file -----
                            console.error(err);
                            const httpStatus = statusCodes.internalServerError.statusCode;
                            response(httpStatus,statusCodes.internalServerError);
                        }
                        else {
                            if (cpObj.password) {
                                cpObj.password = hashPassword('sha256',cpObj.password);
                            }

                            if (cpObj.newMobileNo) {
                                //----- create data file and delete old data file ie MobileNo
                                const oldmobileNo = cpObj.mobileNo;
                                cpObj.mobileNo    = cpObj.newMobileNo;
                                delete cpObj.newMobileNo;

                                for (let field in cpObj) {
                                    userObj[field] = cpObj[field];
                                }
                                //---- update user, create newMobileNo file with updated data -----
                                storage.create('users',userObj.mobileNo.toString(),userObj,(err) =>{
                                    if (err) {
                                        //----- error, user exists with updating newMobileNo
                                        console.log(err);
                                        const httpStatus = statusCodes.userExistsUpdateError.statusCode
                                        response(httpStatus,statusCodes.userExistsUpdateError);
                                    }
                                    else {
                                        //----- delete old mobile data file ----
                                        storage.delete('users',oldmobileNo.toString(),(err) => {
                                            if (err) {
                                                //----- internal fs error ----
                                                console.error(err);
                                                const httpStatus = statusCodes.internalServerError.statusCode;
                                                response(httpStatus,statusCodes.internalServerError);
                                            }
                                            else {
                                                //----- update token data file with mobileNo -----
                                                let tObj = {};
                                                tObj.mobileNo = userObj.mobileNo;
                                                tObj.tokenId = tokenObj.tokenId;
                                                tObj.tokenExpiry = tokenObj.tokenExpiry;

                                                storage.update('tokens',tObj.tokenId,tObj,(err) => {
                                                    if (err) {
                                                        console.error(err);
                                                        const httpStatus = statusCodes.internalServerError.statusCode;
                                                        response(httpStatus,statusCodes.internalServerError);
                                                    }
                                                    else {
                                                        //----- user updated success ----
                                                        const httpStatus = statusCodes.userUpdated.statusCode;
                                                        response(httpStatus,statusCodes.userUpdated);
                                                    }
                                                });
                                            }
                                        });     
                                    }
                                });
                            }
                            else {
                                for (let field in cpObj) {
                                    userObj[field] = cpObj[field];
                                }
                                storage.update('users',userObj.mobileNo.toString(),userObj,(err) => {
                                    if (err) {
                                        console.error(err)
                                        const httpStatus = statusCodes.internalServerError.statusCode;
                                        response(httpStatus,statusCodes.internalServerError);
                                    }
                                    else {
                                        const httpStatus = statusCodes.userUpdated.statusCode;
                                        response(httpStatus,statusCodes.userUpdated);
                                    }
                                });
                            }  
                        }
                    });
                }
                else {
                    const httpStatus = statusCodes.tokenExpiredError.statusCode;
                    response(httpStatus,statusCodes.tokenExpiredError);
                }
            }
            else {
                const httpStatus = statusCodes.invalidCredentialsError.statusCode;
                response(httpStatus,statusCodes.invalidCredentialsError);
            }
        }
    });
}

   
function userPutValidate(cpObj,response) {
    const requiredFields = ['mobileNo','tokenId'];
    const optionalFields = ['firstName','lastName','email','password','newMobileNo'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return false;

    cpObj = fieldsValidate(cpObj);
    if(cpObj) {
        const mobileNo = cpObj.mobileNo;
        const tokenId = cpObj.tokenId;
        delete cpObj.mobileNo; delete cpObj.tokenId;
        for (let field in cpObj) {
            if (optionalFields.indexOf(field) >=0) {
                if (cpObj[field]) {
                    continue;
                }
                else {
                    response(400,invalidFields);
                    return false;    
                }
            }
            else {
                response(400,invalidFields);
                return false;
            }
        }
        cpObj.mobileNo = mobileNo;
        cpObj.tokenId  = tokenId;
        return cpObj;
    }
    else {
        //----- fields validate function failed -----
        const httpStatus = statusCodes.internalServerError.statusCode;
        response(httpStatus,statusCodes.internalServerError);
        return false;
    }
}


export default users;