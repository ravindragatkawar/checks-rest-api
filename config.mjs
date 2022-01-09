//----- environments configuration for app -----
//----- default environment is developement -----


let envs = {};

envs.developement =  {
    'envName'   : 'developement',
    'httpPort'  : 3000,
    'httpsPort' : 3001,
    'secrete'   : 'this is a secret for password enc',
    'maxChecks' : 5
}

envs.production = {
    'envName'   : 'production',
    'httpPort'  : 80,
    'httpsPort' : 443,
    'secrete'   : 'this is a secret for password enc',
    'maxChecks' : 5
}   


const cmdEnv = process.env.NODE_ENV;
let config = {};

//----- if NODE_ENV is not given on command line or not found in config environment(envs) -----
//----- then set development as default app environment -----

if (typeof cmdEnv == 'undefined' || typeof envs[cmdEnv] == 'undefined') {
    config = envs.developement;
}
else {
    config = envs[cmdEnv];
}

export default config;