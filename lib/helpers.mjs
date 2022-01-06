//----- helper functions for main code added here ----

export function jsonParse(jsonStr) {
    try {
        jsonObj = JSON.parse(jsonStr);
        return jsonObj;
    }
    catch(err) {
        console.error(err);
        return false;
    }
}