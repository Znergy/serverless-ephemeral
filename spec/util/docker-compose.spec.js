const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const getStubs = () => {
    const streamStub = {
        on: sinon.stub(),
    };

    const shellStub = {
        which: sinon.stub(),
        exec: sinon.stub(),
    };

    shellStub.which.callsFake(() => true);
    shellStub.exec.callsFake(() => streamStub);

    const util = proxyquire('../../src/util/docker-compose', {
        shelljs: shellStub,
    });

    return { util, streamStub, shellStub };
};

test('Validates that Docker is installed', (t) => {
    const { util } = getStubs();
    t.true(util.validate());
});

test('Validates that Docker is not installed', (t) => {
    const { util, shellStub } = getStubs();

    shellStub.which.callsFake(() => false);
    const error = t.throws(() => { util.validate(); });
    t.is(error.message, 'Docker not found on host machine. Please install it to proceed.');
});

test('Builds a Docker service via compose', (t) => {
    const { util, shellStub, streamStub } = getStubs();

    streamStub.on.withArgs('close').yields();

    return util.build().then(() => {
        const execCall = shellStub.exec.getCall(0);
        t.is(execCall.args[0], 'docker-compose build');
        t.true(execCall.args[1].async);
    });
});

test('Error building a Docker service via compose', async (t) => {
    const { util, streamStub } = getStubs();

    streamStub.on.withArgs('error').yields(new Error('Error building'));

    const error = await t.throws(util.build());
    t.is(error.message, 'Error building');
});

test('Running a Docker container', (t) => {
    const { util, shellStub, streamStub } = getStubs();

    streamStub.on.withArgs('close').yields();

    return util.run('container', {
        volume: 'local:/tmp/container',
        environment: {
            foo: 'bar',
            baz: 1,
        },
    }).then(() => {
        const execCall = shellStub.exec.getCall(0);
        t.is(execCall.args[0],
            'docker-compose run -v local:/tmp/container -e \'foo=bar\' -e \'baz=1\' container');
        t.true(execCall.args[1].async);
    });
});

test('Error running a Docker container', async (t) => {
    const { util, streamStub } = getStubs();

    streamStub.on.withArgs('error').yields(new Error('Error running'));

    const error = await t.throws(util.run('container'));
    t.is(error.message, 'Error running');
});

test('Removes a Docker container', (t) => {
    const { util, shellStub, streamStub } = getStubs();

    streamStub.on.withArgs('close').yields();

    return util.rm('container').then(() => {
        const execCall = shellStub.exec.getCall(0);
        t.is(execCall.args[0], 'docker-compose rm -f container');
        t.true(execCall.args[1].async);
    });
});

test('Error removing a Docker container', async (t) => {
    const { util, streamStub } = getStubs();

    streamStub.on.withArgs('error').yields(new Error('Error removing'));

    const error = await t.throws(util.rm('container'));
    t.is(error.message, 'Error removing');
});
