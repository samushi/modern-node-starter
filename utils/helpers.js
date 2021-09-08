const path = require('path')

class Helpers {
    getPath(dest = "modern-node-starter") {

        if(dest = "."){
            return path.join(process.cwd());
        }

        return path.join(process.cwd(), dest);
    }

    getLibDir(){
        return path.join(__dirname, '../lib');
    }
}

module.exports = new Helpers;