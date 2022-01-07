//----- users handler, handles request on /users -----

import { missingRequiredFields } from "../helpers.mjs";
import { randomString } from "../helpers.mjs";
import { hashPassword } from "../helpers.mjs";
import { fieldsValidate } from "../helpers.mjs";
import storage from '../storage.mjs';

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

const invalidFields = {'err':1, 'msg':'Invalid Fields Sent'}

//-----POST - create new user , error if user exists -----
//----- required fields: mobileNo, firstName, lastName, password, email, tnc

user.POST = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    let userObj = userPostValidate(cpObj,response);
    if (!userObj) return;
    
    userObj.password    = hashPassword('sha256',userObj.password);
    userObj.tokenId     = randomString(20);
    userObj.tokenExpiry = Date.now() + 1000*60*120;  

    storage.create('users',userObj.mobileNo.toString(),userObj,(err) => {
        if (err) {
            console.error(err);
            response(409,{'err':1, 'msg':'Error Creating User, User May Already Exists'});
            }
        else {
            let rsObj = {};
            rsObj.mobileNo = userObj.mobileNo;
            rsObj.tokenId  = userObj.tokenId;
            rsObj.tokenExpiry = userObj.tokenExpiry;

            storage.create('tokens',rsObj.tokenId,rsObj,(err) => {
                if (err) {
                    console.error(err);
                    response(500, {'err':1, 'msg':'Internal Server Error'});
                }
                else {
                    rsObj.err = 0,
                    rsObj.msg = 'User Created SuccessFully';
                    response(201,rsObj);
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
            response(400,invalidFields);
            return false;
        }
    }
    else {
        console.error('Error Failure in Fields Validation');
        response(500);
        return false;
    }
}


//----- GET send user information, error if user doesn't exists
//----- required fields: mobileNo and tokenId -----

user.GET = (routeData,response) => {
    let cpObj = userGetValidate(routeData,response);
    if (!cpObj) return;

    storage.read('users',cpObj.mobileNo,(err,userObj) => {
        if (err) {
            response(405,{'err':1, 'msg':'Error User Not Found'});
        }
        else {
            if (cpObj.tokenId !== userObj.tokenId) {
                response(409,{'err':1, 'msg':'Invalid Credentials'});
            }
            else {
                if (userObj.tokenExpiry > Date.now()) {
                    for (let field of ['password','tokenId','tokenExpiry']) {
                        delete userObj[field];
                    }
                    userObj.err = 0;
                    userObj.msg = "User Fetched SuccessFully"
                    response(200,userObj);
                }
                else {
                    response(409,{'err':1, 'msg':'User Token Expired'});
                }
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
            response(400,invalidFields)
            return false;
        }
    }
    else {
        response(500,{'err':1, 'msg':'Fields Validation Error'});
        return false
    }
    
}


//----- DELETE , deletes and existing user, error if user doesn't exists -----
//----- required fields: mobileNo and password -----

user.DELETE = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = userDeleteValidate(cpObj,response);
    if (!cpObj) return;

    storage.read('users',cpObj.mobileNo,(err,userObj) => {
        if (err) {
            console.error(err);
            response(409,{'err':1, 'msg':'User Doesn\'t Exists'});
        }
        else {
            cpObj.password = hashPassword('sha256',cpObj.password);
            if (cpObj.password === userObj.password) {
                storage.delete('tokens',userObj.tokenId,(err) => {
                    if (err) {
                        console.log(err);
                        response(500,{'err':1, 'msg':'Internal Server Error'});
                    }
                    else {
                        storage.delete('users',userObj.mobileNo,(err) => {
                            if (err) {
                                console.log(err);
                                response(500,{'err':1, 'msg':'Internal Server Error'});        
                            }
                            else {
                                response(200,{'err':0, 'msg':'User Deleted SuccessFully'});
                            }
                        });
                    }
                });
            }
            else {
                response(409,{'err':1, 'msg': 'Invalid Credentials'});
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
    }
    else {
        response(500,{'err':1, 'msg':'Field Validation Failed'});
        return false;
    }
}
export default users;