const Library = require('./Library');

class Fetch {
    constructor (serverless, ephemeral, options = {}) {
        this.serverless = serverless;
        this.ephemeral = ephemeral;

        this.file = null;  // set on child libraries
        this.useCached = options.useCached || true;
        this.unzipped = new Library(this.ephemeral.paths.pkg);
    }

    addDirectory (path = '') {
        if (path.length) {
            this.unzipped.dir += `/${path}`;
        }
    }

    // eslint-disable-next-line class-methods-use-this
    fetch () {
        throw new Error('fetch must be implemented in child class');
    }
}

module.exports = Fetch;