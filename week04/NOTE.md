###浏览器总论
1.把 URL 打包成 HTTP 发出去
2.得到 HTML 进行解析
3.得到 DOM 并进行 CSS 计算
4.得到带 CSS 的 DOM，计算 Layout // 布局，或者排版
5.得到带 Position 的 DOM，生成 Bitmap // 具体是指每个 CSS 生成的盒的位置。
Bitmap：专业术语，只有它最后传给显卡驱动设备才能转换成人眼可识别的光信号
从一个 URL 得到一张 Bitmap，是浏览器的基础渲染过程

###有限状态机
有限状态机  重点在 机 
特点：
1.每个状态都是一个机器，互相解耦
        在每个机器里，我们可以做计算、存储、输出。。。
        所有这些机器接受的输入是完全一致的  （如数据类型）
        状态机的每个机器本身不能有状态，如果用函数来表示，应该是纯函数（无副作用，不再受外部输入控制）

2.每一个机器都必须知道下一个状态
        每个机器都有确定的下一个状态（如 Moore 状态机，不受输入影响，做分支）
        每个机器根据输入决定下一个状态（如Mealy 状态机，接受不同的输入，进入分支）

###使用状态机处理字符串  技巧
````
function end(c) {
	return end; // 让 end 函数永远返回它自己，就是一个 trap
}
````

````
reConsume 
````

### HTTP原理
ISO-OSI        七层网络模型

应用           HTTP                require ('http')
表示
会话

传输           TCP                 require('net')

网络           Internet            

数据链路        4G/5G/wifi         对数据准确传输，点对点连接
物理层

content type 是一个必要字段 要有默认值
body 是KV (key value) 格式
不同的content type 影响body的格式
记得content length

response
HTTP/1.1 200 OK       status  line    (HTTP协议的版本号   HTTP状态码   HTTP状态文本 )

#### Send 函数总结
send 函数是异步的，所以返加 Promise
````
Response 的格式
HTTP/1.1 200 OK
Content-Type: text/html
Date: Mon, 23 Dec 2019 06:56:19 GMT
Connection: keep-alive
Transfer-Encoding: chunked
````
