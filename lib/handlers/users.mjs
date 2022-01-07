//----- users handler, handles request on /users -----

import { missingRequiredFields } from "../helpers.mjs";
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

const invalidFields         = {'err':1, 'msg':'Invalid Fields Sent'}

//-----POST - create new user , error if user exists -----
//----- required fields: mobileNo, firstName, lastName, password, email, tnc

user.POST = (routeData,response) => {
    let cpObj = routeData.clientPayload;
    cpObj = userPostValidate(cpObj,response);
    if (!cpObj) return;
    
    storage.create('users',cpObj.mobileNo.toString(),cpObj,(err) => {
        if (err) {
            console.error(err);
            response(409,{'err':1, 'msg':'Error Creating User, User May Already Exists'});
            }
        else {
            response(201,{'err':0, 'msg':'User Created SuccessFully'});
            }
    });
}   

function userPostValidate(cpObj,response) {
    const requiredFields = ['mobileNo','email','firstName','lastName','password','tnc'];
    const err = missingRequiredFields(cpObj,requiredFields,response);
    if (err) return;
    
    //----- validate client payload according to constraints -----
    //----- and also discard if any extra fields are sent by client -----
    cpObj = fieldsValidate(cpObj);

    //----- verify if all required fields are true -----
    if (cpObj) {
        if (cpObj.mobileNo && cpObj.email && cpObj.firstName && cpObj.lastName && cpObj.password && cpObj.tnc) {
            return cpObj;
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



export default users;