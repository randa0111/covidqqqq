const { readFile } = require('fs');
const { to } = require('./node/BaseTool');
const { HttpRequest } = require('./node/HttpRequest');

const { USERNAME, PASSWORD, SCKEY } = process.env;
/* 身份验证信息 */
let Cookie = 'languageIndex=0; ',
    __token__ = '',
    authorization = 'Bearer ';
/* 请求头 */
const
    YQFK_HOST = 'https://yqfk.dgut.edu.cn',
    CAS_HOST = 'https://cas.dgut.edu.cn',
    LOGIN_PAGE = CAS_HOST + '/home/Oauth/getToken/appid/illnessProtectionHome/state/home.html',
    Headers = {
        CHROME: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
        HTML: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        JSON: 'application/json;charset=utf-8',
        URL_ENCODE: 'application/x-www-form-urlencoded; charset=utf-8'
    };
const API = {
    /**
     * 初始化登录信息
     * @returns {Promise<string>}
     */
    initSignIn() {
        return new Promise((resolve, reject) => {
            HttpRequest({
                type: 'GET',
                _url: LOGIN_PAGE,
                headers: {
                    Referer: YQFK_HOST,
                    'User-Agent': Headers.CHROME,
                    Accept: Headers.HTML,
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
                    resolve('初始化成功')
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
     * @param {string} username
     * @param {string} password
     * @returns {Promise<string>}
     */
    getLink(username,password) {
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
                    'User-Agent': Headers.CHROME,
                    Referer: LOGIN_PAGE,
                    Origin: CAS_HOST,
                    Accept: Headers.JSON,
                    'Content-Type': Headers.URL_ENCODE,
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
     * @returns {Promise<string>}
     */
    setAuthorization(link) {
        return new Promise((resolve, reject) => {
            HttpRequest({
                type: 'GET',
                _url: link,
                headers: {
                    'User-Agent': Headers.CHROME,
                    Referer: CAS_HOST,
                    Accept: Headers.HTML,
                },
                success: chunk => {
                    const location = chunk.header['location'];
                    const access_token = /(?<=_token=)\S*$/.exec(location);
                    if (access_token === null) {
                        reject('未获取到access_token')
                    } else {
                        authorization += access_token[0];
                        resolve(`成功获取到access_token`)
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
                    'User-Agent': Headers.CHROME,
                    Accept: Headers.JSON,
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
                    'User-Agent': Headers.CHROME,
                    Accept: Headers.JSON,
                    'Content-Type': Headers.JSON,
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
                    'User-Agent': Headers.CHROME,
                    Accept: Headers.JSON,
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
const fn = {
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
                    reject('打开文件失败');
                } else {
                    let sendinfo = {};
                    const send = JSON.parse(data)
                        , keys = Object.keys(send);
                    keys.forEach(key => {
                        const value = baseinfo[key];
                        if (typeof value === 'undefined') {
                            if (key === "confirm") {
                                sendinfo[key] = 1;
                            } else {
                                reject(`缺少键${key}`);
                                return;
                            }
                        } else if(value instanceof Array && value.length === 0){
                            sendinfo[key] = null;
                        } else {
                            sendinfo[key] = value;
                        }
                    });
                    resolve(sendinfo)
                }
            })
        });
    },
    /**
     * 转换为Server酱所需正文格式
     * @param {string} text
     * @returns {string}
     */
    toMarkDown(text) {
        console.log(text);
        return text+'\n\n'
    }
};
(() => {
    let desp = '';
    const md = fn.toMarkDown;
    desp += md('开始自动登录');
    API.initSignIn()
        .then(data => {
            desp += md(data);
            desp += md(`成功获取到Cookie:\n\n${Cookie.replace(/./g,'*')}`);
            desp += md(`成功获取到token:\n\n${__token__.replace(/./g,'*')}`);
            return API.getLink(USERNAME, PASSWORD);
        })
        .then(data => {
            desp += md('登陆成功');
            desp += md(`成功获取到跳转链接:\n\n${data.replace(/./g,'*')}`);
            return API.setAuthorization(data);
        })
        .then(data => {
            desp += md(data);
            desp += md('设置授权头');
            return API.getBaseInfo();
        })
        .then(data => {
            desp += md('获取基本信息成功');
            return fn.filterSendInfo(data);
        })
        .then(data => {
            desp += md('要发送的信息筛选完毕');
            desp += md('提交健康日报表');
            return API.submit(data);
        })
        .then(data => {
            desp += md(data)
        })
        .catch(err => {
            desp += fn.toMarkDown(err)
            API.sendToMe('健康打卡出错',desp);
        })
        .finally(()=>{
            API.sendToMe('健康打卡通知',desp);
        })
})()