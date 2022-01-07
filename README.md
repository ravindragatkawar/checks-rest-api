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
}

On Failure:
{
    "err" : 1,
    "msg" : "failuser message"
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
    "tnc"      : "tnc"
    "err"      : 0,
    "msg"      : "success message"
}

On Failure:
{
    "err" : 1,
    "msg" : "failure message"
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
}

On Failure:
{
    "err" : 1,
    "msg" : "failure message"
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
}

On Failure: 
{
    "err": 1,
    "msg": "failure message"
}


---------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------