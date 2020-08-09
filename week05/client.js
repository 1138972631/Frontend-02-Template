const net = require('net');
const parser = require('./parser.js')
const render = require('./render.js')
const images = require('images');

class Request{
  constructor (options){
    this.method = options.method || 'Get'
    this.host = options.host
    this.port = options.port || '8080'
    this.path = options.path || '/'
    this.body = options.body || {}
    this.headers = options.headers || {}
    if(!this.headers['Content-Type']){
      this.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }
    if(this.headers['Content-Type'] === 'application/json'){
      this.bodyText = JSON.stringify(this.body)
    }else if(this.headers['Content-Type'] === 'application/x-www-form-urlencoded'){
      this.bodyText = Object.keys(this.body).map(key=>`${key}=${encodeURIComponent(this.body[key])}`).join('&')
    }
    this.headers['Content-Length'] = this.bodyText.length
  }
  send(connection){
      console.log('进入 send==========')
    return new Promise((resolve,reject)=>{
      const parser = new ResponseParser;
      if(connection){
          console.log('留下痕迹==============000')
        connection.write(this.toString())
      }else{
        console.log('建立连接==============')
        connection = net.createConnection({
          host:this.host,
          port:this.port
        },()=>{
          connection.write(this.toString())
        })
      }
      console.log('监听结果=============')
      connection.on('data',(data)=>{
        console.log('data', data.toString())
        parser.receive(data.toString())
        if(parser.isFinished){
          resolve(parser.response)
          connection.end()
        }
      })
      connection.on('error',(err)=>{
        console.log('error=============',err)
        reject(err)
        connection.end()  
      })
    })
  }
  toString() {
    return `${this.method} ${this.path} HTTP/1.1\r
    ${Object.keys(this.headers).map(key=>`${key}:${this.headers[key]}`).join('\r\n')}\r
    \r
    ${this.bodyText}`
    }
  }

  class  ResponseParser{
    constructor (){
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;

        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';
        this.bodyParser = null;
    }
    
    get isFinished(){
        return this.bodyParser && this.bodyParser.isFinished;
    }

    get response (){
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/)
        return {
            statusCode:RegExp.$1,
            statusText:RegExp.$2,
            headers:this.headers,
            body:this.bodyParser.content.join('')
        }
    }

    receive(string){
        for(let i= 0; i<string.length; i++ ){
            this.receiveChar(string.charAt(i))
        }
    }
    receiveChar(char){
        if(this.current === this.WAITING_STATUS_LINE){
            if(char === '\r'){
                this.current = this.WAITING_STATUS_LINE_END
            }else{
                this.statusLine +=char
            }
        }else if(this.current === this.WAITING_STATUS_LINE_END){
            if(char === '\n'){
                this.current = this.WAITING_HEADER_NAME
            }
        }else if(this.current === this.WAITING_HEADER_NAME){
            if(char === ':'){
                this.current = this.WAITING_HEADER_SPACE
            }else if(char === '\r'){
                // 所有header都收到了
                this.current = this.WAITING_HEADER_BLOCK_END
                // Transfer-Encoding  有各种不同的值，只用 node 默认值 （chunked） 做示例 
                if(this.headers['Transfer-Encoding' === 'chunked']){
                  this.bodyParser = new TrunkedBodyParser();
                }
            }else{
                this.headerName += char 
            }
        }else if(this.current === this.WAITING_HEADER_SPACE){
            if(char === ' '){
                this.current = this.WAITING_HEADER_VALUE
            }
        }else if(this.current === this.WAITING_HEADER_VALUE){
            if(char === '\r'){
                this.current = this.WAITING_HEADER_LINE_END
                this.headers[this.headerName] = this.headerValue;
                this.headerName = ''
                this.headerValue = ''
            }else{
                this.headerValue += char 
            }
        }else if(this.current === this.WAITING_HEADER_LINE_END){
            if(char === '\n'){
                this.current = this.WAITING_HEADER_NAME
            }
        }else if(this.current === this.WAITING_HEADER_BLOCK_END){
            if(char === '\n'){
                this.current = this.WAITING_BODY
            }
        }else if(this.current === this.WAITING_BODY){
            console.log(char)
        }
    }
}


class TrunkedBodyParser{
    constructor(){
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK = 2;  //含有任何字符
        this.WAITING_NEW_LINW = 3;
        this.WAITING_NEW_LINW_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.current = this.WAITING_LENGTH;
    }
    receiveChar(char){
        if(this.current = this.WAITING_LENGTH){
            if(char === '\r'){
                if(this.length = 0){
                    this.isFinished = true
                }
                this.current = this.WAITING_NEW_LINW_END
            }else{
                this.length *=16 //16进制
                this.length += parseInt(char,16)
            }
        }else if(this.current = this.WAITING_NEW_LINW_END){
            if(char === '\n'){
                this.current = this.READING_TRUNK
            }
        }else if(this.current = this.READING_TRUNK){
            this.content.push(char)
            this.length--;
            if(this.length === 0){
                this.current = this.WAITING_NEW_LINW
            }
        }else if(this.current = this.WAITING_NEW_LINW){
            if(char === '\r'){
                this.current = this.WAITING_NEW_LINW_END
            }
        }else if(this.current = this.WAITING_NEW_LINW_END){
            if(char === '\n'){
                this.current = this.WAITING_LENGTH
            }
        }
    } 
} 


void async function (){
  let request = new Request({
    method:'POST',  //http
    host:'127.0.0.1', //ip
    port:'8080',  //tcp
    path:'/',  //http
    headers:{   //http
      ['X-Foo2']:'customed'
    },
    body:{
      name:'xtp'
    }
  })
  console.log('request===',)
  let response = ''
 request.send().then(res=>{
console.log('send===res===',res)
response=res
 },error=>{
     console.log('send==error===',error)
 });

//   完整的获取到body,再进行处理，实际过程中，要逐段的进行返回  异步分段处理
  let dom = parser.parseHTML(response.body)

  let viewport = images(800,600)
//   render(viewport,dom.children[0].children[3].children[1].children[3]) //单个元素
  render(viewport,dom) //Dom
  viewport.save('viewport.jpg')

}();
