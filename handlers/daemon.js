const {
    global: globalOpts,
    output: outputOpts,
    telegram: telegramOpts,
    mirai: miraiOpts,
    uplink: uplinkOpts,
    extract: extractOpts,
    injectOptions
} = require('./_options')
const RUN = require('./run')
const setupSigterm = require('../lib/sigterm-handler')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
    yargs: yargs => injectOptions(yargs, globalOpts, outputOpts, telegramOpts, miraiOpts, uplinkOpts, extractOpts)
        .usage('$0 daemon <room_id> [options]')
        .positional('room_id', {
            describe: 'room id or live url',
            type: 'string'
        })
        .option('i', {
            alias: 'interval',
            describe: 'status check interval, in seconds, rec. >60s',
            type: 'number',
            default: 60
        })
    ,
    handler: async argv => {
        if (argv.extract && (argv.output === '-' || argv.output === '')) {
            console.error(`--extract can not work with stdout output`)
            process.exit(1)
        }

        setupSigterm()
        while (true) {
            const ret = await RUN.handler({
                ...argv,
                daemon: true    // use daemon flag to prevent suicide on failure
            })

            const interval = !ret ? argv.interval : 5    // if errored, retry aggressively
            await sleep(interval * 1000)
        }
    }
}