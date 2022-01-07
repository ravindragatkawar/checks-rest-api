//------ tokens handler handlers requests to /tokens ------

import { hashPassword } from "../helpers.mjs";
import { missingRequiredFields,fieldsValidate,randomString } from "../helpers.mjs";
import storage from "../storage.mjs";


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

    //----- read user and validate mobileNo and password -----
    storage.read('users',cpObj.mobileNo.toString(),(err,userObj) => {
        if (err) {
            response(409,{'err':1, 'msg':'Error Creating Token, User Don\'t Exists'});
        }
        else {
            cpObj.password = hashPassword('sha256',cpObj.password);

            if (cpObj.mobileNo === userObj.mobileNo && cpObj.password === userObj.password) {
                //----- if authenticating mobileNo and password successfull then
                //----- update user with token_id and token_expiry field, 
                const oldTokenId = userObj.token_id;
                userObj.token_id = randomString(20);
                userObj.token_expiry = Date.now() + 1000*60*60;
                
                storage.update('users',userObj.mobileNo.toString(),userObj,(err) => {
                    if (err) {
                        console.error(err)
                        response(500,{'err':1, 'msg':'Internal Server Error'});
                    }
                    else {
                        //---- after updating user data, create token data file separately -----
                        let rsObj = {};
                        rsObj.mobileNo = userObj.mobileNo;
                        rsObj.token_id = userObj.token_id;
                        rsObj.token_expiry = userObj.token_expiry;

                        storage.create('tokens',rsObj.token_id,rsObj,(err) => {
                            if (err) {
                                console.error(err);
                                response(500, {'err':1, 'msg':'Internal Server Error'});  
                            }
                            else {
                                rsObj.err = 0;
                                rsObj.msg = 'Token Created SuccessFully';
                                response(201,rsObj);

                                if (oldTokenId) {
                                    storage.delete('tokens',oldTokenId,(err) => {
                                        if (err) console.error(err);
                                    });
                                }
                            }
                        });
                    }
                });
            }
            else {
                response(409,{'err':1, 'msg':'Invalid Credentials'});
            }       
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
        response(500);
        return false;
    }
}





export default tokens;

