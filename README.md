# checks-rest-api
nodejs REST API that checks status of url's 

##### API GUIDE #####

--------------------------------------------------------------------
PATH: /users             HTTP METHOD: POST
--------------------------------------------------------------------
Creates New User.

Required Fields To Send:
---
{
    "mobileNo" : 10-digit-number/ not a string,
    "email"    : "non-zero string",
    "password" : "non-zero string",
    "firstName": "non-zero string",
    "lastName" : "non-zero string",
    "tnc"      :  true  (boolean value false won't create new user)
}


Response Fields Will Get:
---
On Success:
{
    "err"         : 0,
    "msg"         : "success message",
    "mobileNo"    : "Mobile No",
    "tokenId"     : "generated TokenId",
    "tokenExpiry" : "tokenExpiry in Milliseconds"
    "statusCode"  : http status code
}

On Failure:
{
    "err"         : 1,
    "msg"         : "failuser message"
    "statusCode"  : http status code
}

tokenID and mobileNo Must Be Sent In Headers For Further Communication With API Server, Instead Of password and mobileNo. Except When Deleting User Or Generating New TokenId.


--------------------------------------------------------------------
PATH: /users                HTTP METHOD: GET
--------------------------------------------------------------------
Sends Back Users Information.

Required Fields: Fields Must Be Sent In Headers
---
    "mobileNo" = 10 digit MobileNo
    "tokenId"  = "non-zero tokenId string"



Response Fields Will Get:
---
On Success:
{
    "mobileNo" : mobileNo,
    "email"    : "emai",
    "firstName": "firstName",
    "lastName" : "lastName",
    "checks"   : "checks ids array"     
    "err"      : 0,
    "msg"      : "success message"
    "statusCode" : http status code
}

On Failure:
{
    "err"        : 1,
    "msg"        : "failure message",
    "statusCode" : http status code
}


-------------------------------------------------------------------
PATH: /users                HTTP METHOD: PUT
--------------------------------------------------------------------
Updates an Existing User.

Required Fields: 
---
{
    "mobileNo" : 10 digit mobileNo/not a string,
    "tokenId"  : "non-zero tokenId string"
}

Optional- Fields To Be Updated -> firstName, lastName, email, password, newMobileNo 
newMobileNo -> To Update MobileNo

Response Fields Will Get:
---
On Success:
{
    "err" : 0,
    "msg" : "success message"
    "statusCode" : http status code
}

On Failure:
{
    "err" : 1,
    "msg" : "failure message"
    "statusCode" : http status code

}


-------------------------------------------------------------------
PATH: /users                HTTP METHOD: DELETE
--------------------------------------------------------------------
Deletes an Existing User.

Required Fields: 
---
{
    "mobileNo" : 10 digit mobileNo/not a string,
    "password" : "non-zero string"
} 

Responses Fields Will Get:
---
On Success:
{
    "err": 0,
    "msg": "success message"
    "statusCode" : http status code
}

On Failure: 
{
    "err": 1,
    "msg": "failure message"
    "statusCode" : http status code
}


--------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------


-------------------------------------------------------------------
PATH: /tokens                HTTP METHOD: POST
--------------------------------------------------------------------
Creates New auth Tokens For User

Required Fields : 
---
{
    "mobileNo" : 10 digit MobileNo/not a string,
    "password" : "user's password"
}

Respone Fields Will Get:
---
On Success: 
{
    "mobileNo"    : 10 digit MobileNo/not a string,
    "tokenId"     : "tokenId string",
    "tokenExpiry" : "TokenExpiry in millisecondes"
    "err"         : 0,
    "msg"         : "success message"
    "statusCode" : http status code

}

On Failure:
{
    "err" : 1,
    "msg" : "failure message"
    "statusCode" : http status code

}


-------------------------------------------------------------------
PATH: /tokens                HTTP METHOD: PUT
--------------------------------------------------------------------
Extends tokenExpiry By 1 Hour (From The When Requested) On Existing tokenId

Required Fields:
---
{
    "mobileNo"    : 10 digit MobileNo/not a string,
    "tokenId"     : "tokenId string",
    "extend"      : true
}

Response Fields Will Get:
---
On Success:
{
    "tokenExpiry": "TokenExpiry in milliseconds "
    "err"        : 0,
    "msg"        : "sucess message",
    "statusCode" : http status code
}

On Failure:
{
    "err"        : 1,
    "msg"        : "failure message",
    "statusCode" : http status code
}


-------------------------------------------------------------------
PATH: /tokens                HTTP METHOD: GET
--------------------------------------------------------------------
Sends Token Information 

Required Fields :
---
{
    "mobileNo"    : 10 digit MobileNo/not a string,
    "tokenId"     : "tokenId string"
}

Response Fields:
---
On Success:
{
    "tokenId"     : "tokenId ",
    "tokenExpiry" : "TokenExpiry in millisecondes"
    "err"         : 0,
    "msg"         : "sucess message",
    "statusCode"  : http status code
}

On Failure:
{
    "err"        : 1,
    "msg"        : "failure message",
    "statusCode" : http status code
}






-------------------------------------------------------------------
PATH: /tokens                HTTP METHOD: DELETE
--------------------------------------------------------------------
Deletes User Tokens

Required Fields:
---
{
    "mobileNo"    : 10 digit MobileNo/not a string,
    "tokenId"     : "tokenId string",
}

Response Fields Will Get:
---
On Success:
{
    "err": 0,
    "msg": "success message"
    "statusCode" : http status code
}

On Failure:
{
    "err" : 1,
    "msg" : "failure message"
    "statusCode" : http status code
}


--------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------


-------------------------------------------------------------------
PATH: /checks               HTTP METHOD: POST
--------------------------------------------------------------------
Creates New Check For User

Required Fields:
---
{
    "mobileNo"       : 10 digit MobileNo/not a string,
    "tokenId"        : "tokenId string",
    "checkName"      : "name for this check",
    "protocol"       : "http or https",
    "url"            : "URL to check",
    "method"         : "http method to use",
    "succesCodes"    : "http success codes",
    "timeOutSeconds" : "failure timeout seconds"
}

Response Fields Will Get :
---
On Success:
{
    "err": 0,
    "msg": "success message"
    "statusCode" : http status code,
    "checkName"  : "check name given by user"
    "checkId"    : "id of check from server"
}

on Failure:
{
    "err": 1,
    "msg": "failure message"
    "statusCode" : http status code
}
