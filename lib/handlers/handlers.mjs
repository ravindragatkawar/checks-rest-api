//----- import all handler files here and export it to handler index -----

import users from './users.mjs';
import tokens from './tokens.mjs';
import checks from './checks.mjs';

let handler = {}


handler.ping = (routeData,response) => {
    response(200,{ 'err':0, 'msg':'pong' });          
}

handler.notFound = (routeData,response) => {
    response(404,{ 'err':1, 'msg':'Page Not Found'});
}

handler.users = users;
handler.tokens = tokens;
handler.checks = checks;

export default handler;