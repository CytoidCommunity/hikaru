module.exports = function parseMiraiAPI(str) {
    if (!str) return null

    const [info, server] = str.split('@')
    if (!(info && server)) {
        throw new Error('Invalid Mirai API format, expect: <qq>:<authkey>@<host>:<port>')
    }
    const [qq, authkey] = info.split(':')
    if (!(qq && authkey)) {
        throw new Error('Invalid Mirai API format, expect: <qq>:<authkey>@<host>:<port>')
    }
    const [host, port] = server.split(':')
    if (!(host&& port)) {
        throw new Error('Invalid Mirai API format, expect: <qq>:<authkey>@<host>:<port>')
    }

    return {
        qq: parseInt(qq),
        authkey: authkey,
        host: host,
        port: parseInt(port)
    }
}