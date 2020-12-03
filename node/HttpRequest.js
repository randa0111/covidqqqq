const { request } = require('https');
const { stringify } = require('querystring');
/**
 * 简化nodejs发送http请求的步骤
 * @param {
        {
            type: string;
            _url: string;
            _query_string: object;
            contents: object;
            headers: object;
            success: (chunk: {
                header: object;
                body: string;
            }) => {};
            error: (err: string)=>{};
        }
    } obj
 */
exports.HttpRequest = obj => {
    const type = obj.type;
    const _url = obj._url;
    const headers = obj.headers;
    const _query_string = obj._query_string;
    const contents = formatContents(headers['Content-Type'],obj.contents);
    if (!/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+).)+([A-Za-z0-9-~/])+$/.test(_url)) {
        console.log('url无效');
        return;
    }
    /**
     * 处理options
     */
    let options = {
        host: /(?<=https?:\/\/)[a-zA-Z.]*(?=\/)/.exec(_url)[0],
        path: /(?<=https?:\/\/.*)\/.*/.exec(_url)[0],
        headers: headers,
    };
    let query_string = '';
    switch (type) {
        case 'get':
        case 'GET':
            options.method = 'GET';
            if (typeof _query_string !== 'undefined') {
                query_string = stringify(_query_string);
            }
            if (query_string != '') {
                let url = _url + '?' + query_string;
                options.path = /(?<=https?:\/\/.*)\/.*/.exec(url)[0];
            }
            break;
        case 'post':
        case 'POST':
            options.method = 'POST';
            options.headers['Content-Length'] = Buffer.byteLength(contents, 'utf-8');
            if (typeof headers['Content-Type'] ==='undefined') {
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
            }
            break;
        default:
            console.log('请检查传入HttpRequest方法的对象中的type属性');
            break;
    }
    /**
     * 发送Http请求
     */
    const req = request(options, res => {
        let protodata = '';
        if (res.statusCode < 400) {
            res.setEncoding('utf8');
            res.on('data', chunk => {
                protodata += chunk
            })
            res.on('end', () => {
                obj.success({
                    header: res.headers,
                    body: protodata
                })
            })
        } else {
            console.log(`${res.statusCode} RESPEND ERROR!`);
            obj.error(`网络错误`);
        }
    });
    if (type === 'POST') {
        req.write(contents)
    }
    req.on('error', (err) => {
        console.error("REQUEST ERROR!")
        obj.error(`请求失败${err}`);
    });
    req.end()
}
/**
 * 处理请求体
 * 默认url编码字符串
 * @param {string} contentstype 请求的内容格式
 * @param {object} contents 请求体
 * @returns {string} 格式化字符串
 */
function formatContents(contentstype,contents) {
    if (/application\/x-www-form-urlencoded/i.test(contentstype)) return stringify(contents)
    if (/application\/json/i.test(contentstype)) return JSON.stringify(contents)
    return '';
}