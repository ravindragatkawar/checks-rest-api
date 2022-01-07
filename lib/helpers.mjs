//----- helper functions for main code added here ----

//----- json string to object -----

export function jsonParse(jsonStr) {
    try {
        const jsonObj = JSON.parse(jsonStr);
        return jsonObj;
    }
    catch(err) {
        console.error(err);
        return false;
    }
}

//----- missing fields error and response -----

export function missingRequiredFields(cpObj,requiredFields,response) {
    const missingRequiredFields = {'err':1, 'msg':'Missing Required Fields'};
    
    //----- verify if client sent payload or not, if sent check all required fields are there -----
    if (!cpObj) {
        response(400,missingRequiredFields);
        return true;
    }
    for (let field of requiredFields) {
        if (typeof cpObj[field] == 'undefined') {
            response(400,missingRequiredFields);
            return true;
        }
    }
    return false;
}


//----- validate client payload according to constraints -----

export function fieldsValidate(cp) {
    let fp = {};

    if (cp.mobileNo) {
        fp.mobileNo = typeof cp.mobileNo == 'number' && cp.mobileNo.toString().length === 10? cp.mobileNo : false;
    }
    if (cp.newMobileNo) {
        fp.newMobileNo = typeof cp.newMobileNo == 'number' && cp.newMobileNo.toString().length === 10? cp.newMobileNo : false;
    }
    if (cp.email) {
        fp.email = typeof cp.email == 'string' && cp.email.trim().length > 0? cp.email.trim() : false;
    }
    if (cp.firstName) {
        fp.firstName = typeof cp.firstName == 'string' && cp.firstName.trim().length > 0? cp.firstName.trim() : false; 
    }
    if (cp.lastName) {
        fp.lastName = typeof cp.lastName == 'string' && cp.lastName.trim().length > 0? cp.lastName.trim() : false;
    }
    if (cp.password) {
        fp.password = typeof cp.password == 'string' && cp.password.trim().length > 0? cp.password.trim() : false;
    }
    if (cp.tnc) {
        fp.tnc = typeof cp.tnc == 'boolean' && cp.tnc === true? true : false;
    }

    return fp;
}