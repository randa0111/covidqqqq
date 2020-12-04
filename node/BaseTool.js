module.exports = {
    /**
     * await数据封装
     * @template T
     * @param {Promise<T>} promise
     * @returns {Promise<[err: T,data?: T]>}
     */
    to: promise => promise
    .then(data => [undefined, data])
    .catch(err => [err])
}