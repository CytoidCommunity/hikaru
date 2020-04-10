const axios = require('axios').default

const tryJSON = resp => {
    try {
        return JSON.parse(resp.text)
    } catch(e) {
        return null
    }
}

const unwrapResp = resp => {
    // unwrap superagent http resp
    if (resp.status === 200) {
        // unwrap RESTful response
        // API may return text/html for JSON
        const body = tryJSON(resp.data) || resp.data
        if (body.code === 0) {
            return body
        } else {
            throw new Error(`API Failed: ${resp.request.path} -> ${body.code || ''} - ${body.msg || ''}`)
        }
    } else {
        throw new Error(`API Failed: ${resp.request.path} -> non-success http status: ${resp.status}, ${JSON.stringify(resp.data)}`)
    }
}

const getSession = (url, authkey) => axios
    .post(`${url}/auth`, {authKey: authkey})
    .catch(err => {
        if (err.response) unwrapResp(err.response)
        else throw new Error(err.message)
    })
    .then(unwrapResp)
    .then(body => body.session)

const verifySession = (url, session, qq) => axios
    .post(`${url}/verify`, {sessionKey: session,qq: qq})
    .catch(err => {
        if (err.response) unwrapResp(err.response)
        else throw new Error(err.message)
    })
    .then(unwrapResp)

const releaseSession = (url, session, qq) => axios
    .post(`${url}/release`, {sessionKey: session, qq: qq})
    .catch(err => {
        if (err.response) unwrapResp(err.response)
        else throw new Error(err.message)
    })
    .then(unwrapResp)

const sendMessage = (url, session, group, msg) => axios
    .post(`${url}/sendGroupMessage`, {
        sessionKey: session,
        target: group,
        messageChain: msg
    })
    .catch(err => {
        if (err.response) unwrapResp(err.response)
        else throw new Error(err.message)
    })
    .then(unwrapResp)
    .then(body => body.messageId)

module.exports = {
    sendMMessages: async (miraiOpts, msg) => {
        const {qq, authkey, host, port, group} = miraiOpts;
        const url = `http://${host}:${port}`
        const session = await getSession(url, authkey)
        await verifySession(url, session, qq)
        const messageId = await sendMessage(url, session, group, msg)
        await releaseSession(url, session, qq)
        return messageId
    }
}