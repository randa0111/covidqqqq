/**
 * await数据封装
 * @template T
 * @param {Promise<T>} promise
 * @returns {Promise<[err: T,data?: T]>}
 */
exports.to = (promise) => {
    return promise.then(data => {
        return [undefined, data]
    })
    .catch(err => [err])
}