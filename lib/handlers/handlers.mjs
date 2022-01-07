//----- import all handler files here and export it to handler index -----

import users from './users.mjs';

let handler = {}


handler.ping = (routeData,response) => {
    response(200,{ 'err':0, 'msg':'pong' });          
}

handler.notFound = (routeData,response) => {
    response(404,{ 'err':1, 'msg':'Page Not Found'});
}

handler.users = users;


export default handler;