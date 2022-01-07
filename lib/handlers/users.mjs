//----- users handler, handles request on /users -----

import { missingRequiredFields } from "../helpers.mjs";
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
    
    userObj.password = hashPassword('sha256',userObj.password);
    storage.create('users',userObj.mobileNo.toString(),userObj,(err) => {
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



export default users;