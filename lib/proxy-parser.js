module.exports = function parseProxy(str) {
    if (!str) return null

    const segments = str.split(':')
    if (segments.length !== 2) {
        throw new Error('Invalid proxy format, expect: <host>:<port>')
    }

    return {
        host: segments[0],
        port: parseInt(segments[1], 10)
    }
}
