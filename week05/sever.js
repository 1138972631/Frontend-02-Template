const http = require('http')
http.createServer((request, response)=>{
    let body = [];
    request.on('error',(err)=>{
        console.log('error');
    }).on('data',(chunk)=>{
        console.log('启动了')
        body.push(chunk.toString());
    }).on('end',()=>{
        console.log('结束了')
        body = Buffer.concat(body).toString();
        console.log('body', body);
        response.writeHead(200,{'Content-Type':'text/html'});
        response.end('Hello world\n')
    });
}).listen(8080);
console.log('node sever start');

{/* <head>
    <style>
        #container{
            width: 500px;
            height:300px;
            display:flex;
            background-color:rgb(255,255,255)
        }
        #container #mydiv{
             width: 200px;
             height:100px;
             background-color:rgb(255,0,0)
        }
         #container .c1{
            flex:1;
            background-color:rgb(0,255,0)
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="mydiv"/>
        <div class="c1"/>
    </div>
</body> */}