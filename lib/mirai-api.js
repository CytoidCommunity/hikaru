const axios = require('axios').default

const unwrapResp = resp => {
    // unwrap superagent http resp
    if (resp.status === 200) {
        // unwrap RESTful response
        // API may return text/html for JSON
        const body = resp.data
        if (body.code === 0) {
            return body
        } else {
            throw new Error(`API Failed: ${resp.request.path} -> ${body.code || ''} - ${body.msg || ''}`)
        }
    } else {
        throw new Error(`API Failed: ${resp.request.path} -> non-success http status: ${resp.status}, ${resp.data}`)
    }
}

const getSession = (url, authkey) => axios
    .post(`${url}/auth`, {authKey: authkey})
    .then(unwrapResp)
    .then(body => body.session)

const verifySession = (url, session, qq) => axios
    .post(`${url}/verify`, {sessionKey: session,qq: qq})
    .then(unwrapResp)

const releaseSession = (url, session, qq) => axios
    .post(`${url}/release`, {sessionKey: session, qq: qq})

const sendMessage = (url, session, group, msg) => axios
    .post(`${url}/sendGroupMessage`, {
        sessionKey: session,
        target: group,
        messageChain: [{type:'Plain',text: msg}]
    })
    .then(unwrapResp)
    .then(body => body.messageId)

module.exports = {
    sendMMessages: async (miraiOpts, msg) => {
        const {qq, authkey, host, port, groups} = miraiOpts;
        const url = `http://${host}:${port}`
        const session = await getSession(url, authkey)
        await verifySession(url, session, qq)
        msg_id = []
        for (var group of groups)
            msg_id.push(await sendMessage(url, session, group, msg))
        await releaseSession(url, session, qq)
        return msg_id
    }
}