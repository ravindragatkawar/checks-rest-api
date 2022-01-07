//------ tokens handler handlers requests to /tokens ------


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
    
}
 

export default tokens;

