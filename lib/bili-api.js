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
        if (body.code === 0 && body.data) {
            return body.data
        } else {
            throw new Error(`API Failed: ${resp.request.path} -> ${body.code} - ${body.message || ''} - ${body.msg || ''}`)
        }
    } else {
        throw new Error(`API Failed: ${resp.request.path} -> non-success http status: ${resp.status}, ${JSON.stringify(resp.data)}`)
    }
}

const transformGenderResp = val => {
    if (val === 1) return 'male'
    if (val === 2) return 'female'
    return null
}

const RESPONSE_DEADLINE = 5000    // 5s deadline

module.exports = {
    autoRetry: (fn, ...args) => {
        const autoRetryWrap = () =>
            Promise.resolve(fn(...args)).then(
                ret => ret,
                err => {
                    console.error(err)
                    autoRetryWrap()
                }
            )
        return autoRetryWrap()
    },

    // get room info (live status)
    getRoomInfo: roomid => axios
        .get(
            `http://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomid}`,
            { timeout: RESPONSE_DEADLINE }
        )
        .catch(err => {
            if (err.response) unwrapResp(err.response)
            else throw new Error(err.message)
        })
        .then(unwrapResp)
        .then(body => ({
            uid: body.uid,                    // user id
            roomId: body.room_id,             // canonical room id (for subsequent requests)
            shortId: body.short_id,           // short id
            liveStatus: body.live_status,     // live status, 1 = on air
            liveStartsAt: body.live_time,     // live start time, format = `yyyy-MM-dd hh:mm:ss`, tz +8
            title: body.title,                // live title
            primaryAreaId: body.parent_area_id,     // primary area id
            primaryAreaName: body.parent_area_name,     // primary area text
            coverUrl: body.user_cover,    // cover image url
            tags: body.tags,
        })),

    // get room user, actually room's anchor
    getRoomUser: roomid => axios
        .get(
            `http://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room?roomid=${roomid}`,
            { timeout: RESPONSE_DEADLINE }
        )
        .catch(err => {
            if (err.response) unwrapResp(err.response)
            else throw new Error(err.message)
        })
        .then(unwrapResp)
        .then(body => ({
            uid: body.info.uid,                // user id
            name: body.info.uname,             // user name
            gender: transformGenderResp(body.info.gender),    // user gender
            avatarUrl: body.info.face,          // avatar image
            level: body.info.platform_user_level, // site level
            liveLevel: body.level && body.level.user_level,     // live user level
            liveHostLevel: body.level && body.level.master_level && body.level.master_level.level,    // live host level
            vipType: body.info.vip_type
        })),

    // quality = 4 appears to mean raw (原画), works even if not logged in
    // quality = 3 appears to be High definition, ~1.5Mbps H.264 + 128kbps AAC
    getPlayUrls: (roomid, proxyOpts) => axios
        .get(
            `http://api.live.bilibili.com/room/v1/Room/playUrl?cid=${roomid}&quality=4&platform=web`,
            { timeout: RESPONSE_DEADLINE, proxy: proxyOpts }
        )
        .catch(err => {
            if (err.response) unwrapResp(err.response)
            else throw new Error(err.message)
        })
        .then(unwrapResp)
        .then(body => ({
            quality: body.current_quality,     // quality number
            urls: body.durl.map(entry => ({    // -> array
                order: entry.order,            //    order: ?, likely be used in (轮播)
                url: entry.url,                //    url: cdn url, should be passed to curl / downloader
            }))
        })),

    getDanmakuConf: (roomid) => axios
        .get(
            `http://api.live.bilibili.com/room/v1/Danmu/getConf?room_id=${roomid}`,
            { timeout: RESPONSE_DEADLINE }
        )
        .catch(err => {
            if (err.response) unwrapResp(err.response)
            else throw new Error(err.message)
        })
        .then(unwrapResp)
        .then(body => ({
            servers: body.host_server_list
        }))
}
