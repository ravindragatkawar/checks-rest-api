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
    cpObj = userPostValidate(cpObj,response);
    if (!cpObj) return;
    
    cpObj.password = hashPassword('sha256',cpObj.password);
    cpObj.tokenId  = randomString(20);
    
    storage.create('users',cpObj.mobileNo.toString(),cpObj,(err) => {
        if (err) {
            console.error(err);
            response(409,{'err':1, 'msg':'Error Creating User, User May Already Exists'});
            }
        else {
            let rsObj = {};
            rsObj.mobileNo = cpObj.mobileNo;
            rsObj.tokenId  = cpObj.tokenId
            rsObj.tokenExpiry = Date.now() + 1000*60*120;        
                    
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

    storage.read('tokens',cpObj.tokenId,(err,tokenObj) => {
        if (err) {
            console.error(err);
            response(409,{'err':1, 'msg':'Sent Invalid Token'});
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    storage.read('users',tokenObj.mobileNo.toString(),(err,userObj) => {
                        if (err) {
                            console.error(err);
                            response(500,{'err':1, 'msg':'Internal Server Error'});
                        }
                        else {
                            delete userObj.password;
                            userObj.err = 0;
                            userObj.msg = "User Fetched SuccessFully";
                            response(200,userObj);
                        }
                    });
                }
                else {
                    response(409,{'err':1, 'msg':'User Token Expired'});
                }
            }
            else {
                response(409,{'err':1, 'msg':'Invalid Credentials'});
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

    storage.read('users',cpObj.mobileNo.toString(),(err,userObj) => {
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
            console.error(err);
            response(409,{'err':1, 'msg':'Sent Invalid Token'});
        }
        else {
            if (cpObj.mobileNo === tokenObj.mobileNo) {
                if (tokenObj.tokenExpiry > Date.now()) {
                    storage.read('users',cpObj.mobileNo.toString(),(err,userObj) => {
                        if (err) {
                            console.error(err);
                            response(500,{'err':1, 'msg':'Internal Server Error'});
                        }
                        else {
                            if (cpObj.password) {
                                cpObj.password = hashPassword(cpObj.password);
                            }

                            if (cpObj.newMobileNo) {
                                //----- create data file and delete old data file ie MobileNo
                                const oldmobileNo = cpObj.mobileNo;
                                cpObj.mobileNo    = cpObj.newMobileNo;
                                delete cpObj.newMobileNo;

                                for (let field in cpObj) {
                                    userObj[field] = cpObj[field];
                                }
                                storage.create('users',userObj.mobileNo.toString(),userObj,(err) =>{
                                    if (err) {
                                        console.log(err);
                                        response(409,{'err':1, 'msg':'User Already Exists With Updating MobileNo'});
                                    }
                                    else {
                                        storage.delete('users',oldmobileNo.toString(),(err) => {
                                            if (err) {
                                                console.error(err);
                                                response(500,{'err':1, 'msg':'Internal Server Error'});
                                            }
                                            else {
                                                let tObj = {};
                                                tObj.mobileNo = userObj.mobileNo;
                                                tObj.tokenId = tokenObj.tokenId;
                                                tObj.tokenExpiry = tokenObj.tokenExpiry;

                                                storage.update('tokens',cpObj.tokenId,tObj,(err) => {
                                                    if (err) {
                                                        console.error(err);
                                                        response(500,{'err':1, 'msg':'Internal Server Error'});
                                                    }
                                                    else {
                                                        response(200,{'err':0, 'msg':'User Updated SuccessFully'});
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
                                        response(500,{'err':1, 'msg':'Internal Server Error'});
                                    }
                                });
                            }  
                        }
                    });
                }
                else {
                    response(409,{'err':1, 'msg':'User Token Expired'});
                }
            }
            else {
                response(409,{'err':1, 'msg':'Invalid Credentials'});
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
        response(500,{'err':1, 'msg':'Fields Validation Failed'});
        return false;
    }
}


export default users;