const fs = require('fs');
const request = require('./request');

const typeMap = {
  'string': 'string',
  'date': 'string',
  'localdate': 'string',
  'int': 'number',
  'long': 'number',
  'integer': 'number',
  'bigdecimal': 'number',
  'boolean': 'boolean',
  'response': 'any'
}

// 获取数据描述
function getItemDesc(item, separator = ','){
  const parts = item.description.split(separator)
  return (parts[1] || parts[0])
}

// 把 Object 数据转换为 TypeScript
function createTSText(data, separator){
  const desc = getItemDesc(data, separator);
  let props
  if(data.type === 'array'){
    props = data.items.properties
  }
  if(data.type === 'object'){
    props = data.properties
  }
  if(!props){
    console.log('error ==> props 为 0，请检查 createTSText 函数的入参');
    return '';
  }
  let text = `export interface ${desc} {\n\n`;
  let objectQueue = [];
  Object.keys(props).forEach((key) => {
    const item = props[key]
    let desc = item.description
    let str = `  /** ${desc} */\n  ${key}: `
    let tsType = ''
    if(typeof item.type === 'string'){
      tsType = typeMap[item.type.toLowerCase()]
    }
    // 基本数据类型 
    if(tsType){
      str += tsType
    }
    // 非基本数据类型
    else{
      if(item.type === 'array'){
        const subItem = item.items
        // 原始数据类型的数组
        if(['array', 'object'].indexOf(subItem.type) === -1){
          str += `${typeMap[subItem.type.toLowerCase()]}[]`
        }
        // 对象类型的数组
        else{
          str += `${getItemDesc(item)}`
          objectQueue.push(item)
        }
      } else if (item.type === 'object'){
        str += `${getItemDesc(item)}`
        objectQueue.push(item)
      }
    }
    text += str + ';\n'
  });
  text += '}';
  objectQueue.forEach(obj => {
    text += `\n\n${createTSText(obj)}`;
  })
  return text;
}

function getUrl(url){
  let id = '6138'
  let urlHead = 'http://47.106.118.192:13000/api/interface/get?id='
  console.log("process.argv ==>", process.argv)
  if(url){
    const parts = url.split('/')
    id = parts[parts.length-1]
  }
  return urlHead + id
}

(async function main(){
  const [_0, _1, url, uid, token] = process.argv
  // 发起请求
  const finalUrl = getUrl(url);
  const cookies = [
    `_yapi_token=${token}`,
    `_yapi_uid=${uid}`
  ];
  const [err, res] = await request(finalUrl, 'GET', 'utf-8', cookies);

  // 错误处理
  if(err){
    console.log('error ==>', err)
    return false;
  }
  const resObj = JSON.parse(res)
  if(resObj.errcode){
    console.error('res ==>', resObj.errmsg);
    return false;
  }

  // 数据处理
  const resData = resObj.data
  if(resData){
    let requestText = ''
    let responseText = ''

    try{
      if(resData.req_body_other){
        const requestInterface = JSON.parse(resData.req_body_other)
        requestText = createTSText(requestInterface, ':')
      }
      if(resData.res_body){
        const resBody = resData.res_body ? JSON.parse(resData.res_body) : ''
        const responseInterface = resBody.properties.data
        responseText = createTSText(responseInterface)
      }
    } catch(err){
      console.log('parse error ==>', err);
    }
    const finalText = requestText + '\n\n' + responseText

    fs.writeFile('test.ts', finalText, (err) => {
      if(err) console.error('error ==>', err);
    })
  }
})();

// async function getApi(){
//   let pt, page
//   try{
//     pt = await phantom.create();
//     page = await pt.createPage();
//     const _status = await page.open('http://47.106.118.192:13000/project/35/interface/api/6138');
//     const content = await page.property('content');
//     const $ = cheerio.load(content);
//     const colQuery = $('#yapi .colQuery')
//     console.log('res ==>', colQuery);
//   } catch(err){
//     console.log('error ==>', err)
//   } finally{
//     if(page) page.close();
//     pt.exit();
//   }
// }
// getApi();