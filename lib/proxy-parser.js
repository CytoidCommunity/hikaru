module.exports = function parseProxy(str) {
    if (!str) return null

    const segments = str.split(':')
    if (segments.length !== 2) {
        throw new Error('Invalid proxy format, expect: <host>:<port>')
    }

    return {
        host: segments.slice(0, 2).join(':'),
        port: parseInt(segments[2], 10)
    }
}