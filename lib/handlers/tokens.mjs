//------ tokens handler handlers requests to /tokens ------

import { missingRequiredFields } from "../helpers.mjs";
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
            if (cpObj.mobileNo === userObj.mobileNo && cpObj.password === userObj.password) {
                const token_id     = ;
                const token_expiry = 
                
                storage.create('tokens',,(err) => {
                    if (err) {
                        console.error(err);
                        response(400,)
                    }
                }); 
            }
            else {
                response(409,{'err':1, 'msg':'Error Invalid Credentials'});
            }
                   
        }
    });
}
 
function tokenPostValidate(cpObj,response) {
    requiredFields = ['mobileNo','password'];
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

