const fs = require('fs');
const request = require('./request');

const typeMap = {
  'String': 'string',
  'Date': 'string',
  'LocalDate': 'string',
  'int': 'number',
  'Long': 'number',
  'Integer': 'number',
  'Boolean': 'string'
}

// 获取数据描述
function getItemDesc(item, separator = ','){
  const parts = item.description.split(separator)
  return parts[1] || parts[0] 
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
    console.lor('error ==> props 为 0，请检查 createTSText 函数的入参');
    return '';
  }
  let text = `export interface ${desc} {\n\n`;
  let objectQueue = [];
  Object.keys(props).forEach((key) => {
    const item = props[key]
    let desc = item.description
    let str = `  // ${desc}\n  ${key}: `
    const tsType = typeMap[item.type]
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
          str += `${typeMap[subItem.type]}[]`
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
    text += str + ';\n\n'
  });
  text += '}';
  objectQueue.forEach(obj => {
    text += `\n\n${createTSText(obj)}`;
  })
  return text;
}

function getUrl(){
  let id = '6138'
  let urlHead = 'http://47.106.118.192:13000/api/interface/get?id='
  if(process.argv[2]){
    const parts = process.argv[2].split('/')
    id = parts[parts.length-1]
  }
  return urlHead + id
}

(async function main(){
  // 发起请求
  const url = getUrl();
  const cookies = [
    '_yapi_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjM1MywiaWF0IjoxNTc3MDg4NjAzLCJleHAiOjE1Nzc2OTM0MDN9.jyR__MD1dQUuqJc0opefCgT3w5i1uSjzIlRzBMjgeYs',
    '_yapi_uid=353'
  ];
  const [err, res] = await request(url, 'GET', 'utf-8', cookies);

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
      console.log('parse error ==>', err)
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