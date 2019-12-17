const http = require('http')
const iconv = require('iconv-lite')

/**
 * 让浏览器认为不是爬虫
 */
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.92 Safari/537.36'
}

const request = function(url, method = 'GET', encoding = 'utf-8', cookies){
  return new Promise((resolve) => {
    const req = http.request(url, {
      method,
      // proxy: 'http://127.0.0.1:1087',
      headers: HEADERS
    }, (res) => {
      let chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk)
      })
      res.on('end', () => {
        const result = iconv.decode(Buffer.concat(chunks), encoding);
        resolve([null, result])
      })
      res.on('error', (err)=>{
        resolve([err, null])
      })
    })
    req.setHeader('Cookie', cookies);
    req.end();
  })
}

module.exports = request