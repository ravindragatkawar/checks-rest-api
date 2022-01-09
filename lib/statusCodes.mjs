let statusCodes = {};

statusCodes.internalServerError = {'statusCode':500, 'err':1, 'msg':'Internal Server Error'};
statusCodes.invalidFieldsError = {'statusCode':400, 'err':1, 'msg':'Invalid Fields Sent'};
statusCodes.invalidCredentialsError = {'statusCode':401, 'err':1, 'msg':'Invalid Credentials'};

statusCodes.tokenExpiredError = {'statusCode':401, 'err':1, 'msg':'User Token Expired'}
statusCodes.tokenExpiryExtended = {'statusCode':200, 'err':0, 'msg':'TokenExpiry Extended SuccessFully'};
statusCodes.tokenDeleted = {'statusCode':200, 'err':0, 'msg':'Token Deleted SuccessFully'};


//----- token does not exits, but still send token invalid response -----
//----- (409 conflict) for security instead of not found (404) ----
statusCodes.invalidTokenError = {'statusCode':409, 'err':1, 'msg':'Invalid Token Sent'};

statusCodes.userExistsError = {'statusCode':409, 'err':1, 'msg':'Error Creating User, User May Already Exists'};
statusCodes.userDoNotExistsError = {'statusCode':409, 'err':1, 'msg':'Error User Do Not Exists'};
statusCodes.userExistsUpdateError = {'statusCode':409, 'err':1, 'msg':'Error Updating User, User Exists With newMobileNo'};


statusCodes.userDeleted = {'statusCode':200, 'err':0, 'msg':'User Deleted SuccessFully'};
statusCodes.userCreated = {'statusCode':201, 'err':0, 'msg':'User Created SuccessFully'};
statusCodes.userFetched = {'statusCode':200, 'err':0, 'msg':'User Fetched SuccessFully'};
statusCodes.userUpdated = {'statusCode':200, 'err':0, 'msg':'User Updated SuccessFully'};

statusCodes.tokenCreated = {'statusCode':201, 'err':0, 'msg':'Token Created SuccessFully'};
statusCodes.tokenFetched = {'statusCode':201, 'err':0, 'msg':'Token Fetched SuccessFully'};

statusCodes.checksMaxLimitError = {'statusCode':409, 'err':1 , 'msg': 'Maximum Check Limit Reached'};
statusCodes.checkNameExistsError = {'statusCode':409, 'err':1, 'msg':'checkName Already Exists'};

statusCodes.checkCreated = {'statusCode':201, 'err':0, 'msg':'Check Created SuccessFully'};
statusCodes.checkDeleted = {'statusCode':200, 'err':0, 'msg':'Check Deleted SuccessFully'};
statusCodes.checkUpdated = {'statusCode':200, 'err':0, 'msg':'Check Updated SuccessFully'};
statusCodes.checkFetched = {'statusCode':200, 'err':0, 'msg':'Check Fetched SuccessFully'};


statusCodes.checkNameDoNotExistsError = {'statusCode':409, 'err':1, 'msg':'checkName Do Not Exists'};

export default statusCodes;