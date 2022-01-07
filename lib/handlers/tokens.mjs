//------ tokens handler handlers requests to /tokens ------

import { missingRequiredFields } from "../helpers.mjs";


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

//----- HTTP POST on /tokens create new tokens and sends token info -----
//----- required fields : mobileNo, password -----

token.POST = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = tokenPostValidate(cpObj,response);
    if (!cpObj) return;

    //
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

    }
    else {
        console.error('Error Failure in Fields Validation');
        response(500);
        return false;
    }
}

export default tokens;

