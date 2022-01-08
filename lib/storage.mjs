//----- storage related operations for app -----

import fs from "fs";
import { dirname, join } from "path/posix";
import { fileURLToPath } from "url";
import { jsonParse } from "./helpers.mjs";


//----- create directory structure for storage -----

const dataDir = join(dirname(fileURLToPath(import.meta.url)),'../.data');
const subDir  = ['users','tokens','checks'];

fs.mkdir(dataDir,(err) => {
    for (let dir of subDir) {
        const path = join(dataDir,dir);
        fs.mkdir(path,(err) => {});
    }
    console.log('Data Storage Structure Created For app -> .data/');
});


//---- create, delete, update data files -----

let storage = {};

//---- create data file, callback err if fails ----

storage.create = (dir,file,data,callback) => {
    const path = join(dataDir,dir,file+'.json');
    fs.open(path,'wx',(err,fd) => {
        if (!err && fd) {
            data = JSON.stringify(data);
            fs.writeFile(fd,data,(err) => {
                if (!err) {
                    fs.close(fd,(err) => {
                        if (!err) {
                            callback(false);
                        }
                        else {
                            callback('Error Closing New File');
                        }
                    });
                
                }
                else {
                    callback('Error Writing New File');
                }
            });
        }
        else {
            callback('Error Creating New File, File May Already Exists');
        }
    });
}
//----- delete data file, callback err if fails -----

storage.delete = (dir,file,callback) => {
    const path = join(dataDir,dir,file+'.json');
    fs.unlink(path,(err) => {
        if (err) {
            callback('Error Deleting File, File May Not Exists');
        }
        else{
            callback(false);
        }
    });
} 


//----- read data file, callback err if fails -----

storage.read = (dir,file,callback) => {
    const path = join(dataDir,dir,file+'.json');
    fs.readFile(path,'utf8',(err,data) => {
        if(err) {
            callback(true,'Error Reading File');
        }
        else {
            let jsonObj = jsonParse(data);
            if (jsonObj) {
                callback(false,jsonObj);
            }
            else {
                callback(true,'Error Reading File JSON parse Error');
            }
        }
    });
}


//----- update data file, callback err if fails -----

storage.update = (dir,file,data,callback) => {
    const path = join(dataDir,dir,file+'.json');
    fs.open(path,'r+',(err,fd) => {
        if (!err && fd) {
            data = JSON.stringify(data);
            fs.ftruncate(fd,(err) => {
                if (!err) {
                    fs.writeFile(fd,data,(err) => {
                        if (!err) {
                             fs.close(fd,(err) => {
                                if (!err) {
                                    callback(false);
                                }
                                else {
                                    callback('Error Closing Existing File');
                                }
                             });
                        }
                        else{
                            callback('Error Writing Existing File')
                        }
                    });
                }
                else {
                    callback('Error Truncating File');
                }
            });
        }
        else {
            callback('Error Updating File, File May Not Exists');
        }
    });
}



export default storage;