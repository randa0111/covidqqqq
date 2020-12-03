const { readFile } = require('fs');
const { to } = require('./node/BaseTool');
const { HttpRequest } = require('./node/HttpRequest');

const [username, password,SCKEY] = [
    process.env.USERNAME,
    process.env.PASSWORD,
    process.env.SCKEY,
];
let __token__ = '';
let Cookie = 'languageIndex=0; ';
let authorization = 'Bearer ';
const
    YQFK_HOST = 'https://yqfk.dgut.edu.cn',
    CAS_HOST = 'https://cas.dgut.edu.cn',
    LOGIN_PAGE = CAS_HOST + '/home/Oauth/getToken/appid/illnessProtectionHome/state/home.html',
    RequestHeaders = {
        CHROME: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
        HTML: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        JSON: 'application/json;charset=utf-8',
        URL_ENCODE: 'application/x-www-form-urlencoded; charset=utf-8'
    };
const API = {
    /**
     * 初始化登录信息
     * @returns {Promise<void>}
     */
    initSignIn() {
        return new Promise((resolve, reject) => {
            HttpRequest({
                type: 'GET',
                _url: LOGIN_PAGE,
                headers: {
                    Referer: YQFK_HOST,
                    'User-Agent': RequestHeaders.CHROME,
                    Accept: RequestHeaders.HTML,
                },
                success: chunk => {
                    const _Cookies = chunk.header['set-cookie'];
                    let _Cookie = [];
                    _Cookies.forEach(cookie => {
                        _Cookie.push(cookie.split('; ')[0]);
                    });
                    Cookie += _Cookie.join('; ');
                    const token = /(?<=token\s*=\s*")\S*(?=")/.exec(chunk.body);
                    if(token === null) reject();
                    __token__ = token[0];
                    resolve()
                },
                error: err => {
                    console.log(err);
                    reject('未初始化成功');
                }
            })
        })
    },
    /**
     * 成功登录跳转链接
     * @returns {Promise<string>}
     */
    getLink() {
        return new Promise((resolve,reject) => {
            HttpRequest({
                type: 'POST',
                _url: LOGIN_PAGE,
                contents: {
                    username,
                    password,
                    __token__,
                    wechat_verify: ''
                },
                headers: {
                    'User-Agent': RequestHeaders.CHROME,
                    Referer: LOGIN_PAGE,
                    Origin: CAS_HOST,
                    Accept: RequestHeaders.JSON,
                    'Content-Type': RequestHeaders.URL_ENCODE,
                    Cookie,
                },
                success: chunk => {
                    const data = JSON.parse(chunk.body);
                    if (data.code === 1) {
                        resolve(data.info)
                    } else {
                        reject('未登陆成功')
                    }
                },
                error: err => {
                    console.log(err);
                    reject('未登陆成功')
                }
            })
        });
    },
    /**
     * 设置授权信息
     * @param {string} link
     * @returns {Promise<void>}
     */
    setAuthorization(link) {
        return new Promise((resolve, reject) => {
            HttpRequest({
                type: 'GET',
                _url: link,
                headers: {
                    'User-Agent': RequestHeaders.CHROME,
                    Referer: CAS_HOST,
                    Accept: RequestHeaders.HTML,
                },
                success: chunk => {
                    const location = chunk.header['location'];
                    const access_token = /(?<=_token=)\S*$/.exec(location);
                    if (access_token === null) {
                        reject('未获取到access_token')
                    } else {
                        authorization += access_token[0];
                        resolve()
                    }
                },
                error: err => {
                    console.log(err);
                    reject('未获取到access_token')
                }
            })
        });
    },
    /**
     * 获取基础信息
     * @returns {Promise<JSON>}
     */
    getBaseInfo() {
        return new Promise((resolve, reject) => {
            HttpRequest({
                type: 'GET',
                _url: YQFK_HOST+'/home/base_info/getBaseInfo',
                headers: {
                    Referer: YQFK_HOST+'/main',
                    'User-Agent': RequestHeaders.CHROME,
                    Accept: RequestHeaders.JSON,
                    Cookie,
                    authorization,
                },
                success: chunk => {
                    const res = JSON.parse(chunk.body);
                    if (res.code === 200) {
                        console.log(res.message);
                        resolve(res.info);
                    } else {
                        console.log(res);
                        reject('获取基本信息失败')
                    }
                },
                error: err => {
                    console.log(err);
                    reject('获取基本信息失败')
                }
            })
        });
    },
    /**
     * 获取要发送的信息
     * @param {JSON} baseinfo
     * @returns {Promise<{}>}
     */
    filterSendInfo(baseinfo) {
        return new Promise((resolve, reject) => {
            readFile('send.json',(err,data) => {
                if (err) {
                    console.log(err);
                    reject('打开文件失败')
                } else {
                    let sendinfo = {};
                    const send = JSON.parse(data)
                        , keys = Object.keys(send);
                    keys.forEach(key => {
                        const value = baseinfo[key];
                        if (typeof value === 'undefined') {
                            sendinfo[key] = send[key];
                        } else if(value instanceof Array && value.length === 0){
                            sendinfo[key] = null;
                        } else {
                            sendinfo[key] = send[key];
                        }
                    });
                    resolve(sendinfo)
                }
            })
        });
    },
    /**
     * 提交信息
     * @param {{[key: string]: any}} info
     * @returns {Promise<void>}
     */
    submit(info) {
        return new Promise((resolve, reject) => {
            HttpRequest({
                type: 'POST',
                _url: YQFK_HOST+'/home/base_info/addBaseInfo',
                contents: info,
                headers: {
                    Referer: YQFK_HOST+'/main',
                    Origin: YQFK_HOST,
                    'User-Agent': RequestHeaders.CHROME,
                    Accept: RequestHeaders.JSON,
                    'Content-Type': RequestHeaders.JSON,
                    Cookie,
                    authorization,
                },
                success: chunk => {
                    const res = JSON.parse(chunk.body);
                    if (res.code === 200) {
                        resolve(res.message)
                    } else {
                        console.log(res.message);
                        reject('提交失败')
                    }
                },
                error: err => {
                    console.log(err);
                    reject('提交失败')
                }
            })
        });
    },
    /**
     * Server酱推送
     * @param {string} text 
     * @param {string} desp
     * @return {Promise<string>}
     */
    sendToMe(text, desp) {
        return new Promise((resolve, reject) => {
            HttpRequest({
                type: 'GET',
                _url: `https://sc.ftqq.com/${SCKEY}.send`,
                _query_string: {
                    text,
                    desp
                },
                headers: {
                    'User-Agent': RequestHeaders.CHROME,
                    Accept: RequestHeaders.JSON,
                },
                success: chunk => {
                    const res = JSON.parse(chunk.body);
                    if (res.errno === 0) {
                        resolve('Server酱推送成功')
                    } else {
                        reject('Server酱推送失败')
                    }
                },
                error: err => {
                    console.log(err);
                    reject('Server酱推送失败')
                }
            })
        });
    }
};
(async () => {
    let desp = '';
    await API.initSignIn();
    console.log('开始自动登录');
    desp += '开始自动登录\n\n';
    console.log(`成功获取到Cookie:\n${Cookie.replace('.*','*')}`);
    desp += `成功获取到Cookie:\n${Cookie.replace('.*','*')}\n\n`
    const [err0, link] = await to(API.getLink());
    if (err0) {
        console.log(err0);
        API.sendToMe('健康打卡错误通知',err0)
        return;
    }
    console.log(`获取到跳转链接:\n${link}`);
    desp += `获取到跳转链接:\n${link}\n\n`
    await API.setAuthorization(link);
    const [err1, baseinfo] = await to(API.getBaseInfo());
    if (err1) {
        console.log(err1);
        API.sendToMe('健康打卡错误通知',err1)
        return;
    }
    const [err2, sendinfo] = await to(API.filterSendInfo(baseinfo));
    if (err2) {
        console.log(err2);
        API.sendToMe('健康打卡错误通知',err2)
        return;
    }
    console.log('筛选基本信息');
    desp += '筛选基本信息\n\n';
    console.log('提交健康日报表');
    desp += '提交健康日报表\n\n'
    const [err3, msg0] = await to(API.submit(sendinfo));
    if (err3) {
        console.log(err3);
        API.sendToMe('健康打卡错误通知',err3)
        return;
    }
    console.log(msg0);
    desp += msg0+'\n\n';
    const [err4, msg1] = await to(API.sendToMe('健康打卡通知',desp))
    if (err4) {
        console.log(err4);
        return;
    }
    console.log(msg1);
})()