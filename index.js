const fs = require('fs');
// const phantom = require('phantom');
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
function getItemDesc(item){
  return item.description.split(',')[1]
}

function createTSText(data){
  const desc = getItemDesc(data)
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
    if(tsType){
      str += tsType
    }else{
      if(item.type === 'array'){
        const subItem = item.items
        if(['array', 'object'].indexOf(subItem.type) === -1){
          str += `${typeMap[subItem.type]}[]`
        }else{
          str += `${getItemDesc(item)}`
          objectQueue.push(item)
        }
      } else if (item.type === 'object'){
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

async function getApi(){
  const cookies = [
    '_yapi_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjM1MywiaWF0IjoxNTc2NDYyMTkzLCJleHAiOjE1NzcwNjY5OTN9.joyT6qgzHX4nOn1Y4U8CP_4iJyaXAA6P6ZSaYh4UnXg',
    '_yapi_uid=353'
  ];
  const [err, res] = await request('http://47.106.118.192:13000/api/interface/get?id=6138', 'GET', 'utf-8', cookies);
  if(err){
    console.log('error ==>', err)
    return false;
  }
  const resObj = JSON.parse(res)
  const resData = resObj.data
  if(resData && resData.res_body){
    const body = JSON.parse(resData.res_body)
    const data = body.properties.data
    const text = createTSText(data)
    fs.writeFile('test.ts', text, (err) => {
      if(err) console.error('error ==>', err);
    })
  }
}
getApi();

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