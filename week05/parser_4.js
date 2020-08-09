 /**
  * 本节重点:
  * 1.收集 css 规则
  * ==采用 css 库进行收集
  * 
  * 2.添加调用
  * ==添加css 应用,应用时机越早越好.在css 的设计里面有一条隐藏的潜规则,会尽量保证所有的选择器都能够在 startTag 进入的时候就能够被判断,随着高级选择器增加,规则有所松动,但大部分的规则仍然遵循,当DOM 树构建到 元素的startTag 的步骤就已经可以判断能够匹配哪些CSS规则了,本demo 在startTag 时添加
  * 
  * 3.获取父元素序列
  * 
  * 4.选择器与元素的匹配
  * 
  * 5.算选择器与元素匹配
  * 
  * 6.生成computed 属性
  * ==因为 css rules 里面有 declarations (声明的属性),把声明里的属性一条条的给作用到元素的computed属性上
  * 
  * (layout.js)
  * 7.specificity 计算逻辑
  * ==假设有这样的四元数组: [inline, id, class, tag], 初始值为[0,0,0,0],根据实际情况 改变  如 div div #id 为 [0,1,0,2], div #mydiv #div 为 [0,2,0,1] ,从高位比较,(从左到右)
  * 
  * 8.根据浏览器属性进行排版
  * ==第一代: 正常流 | 第二代:flex | 第三代: grid | 隐隐的感觉  css Houdini 第四代
  * ==demo 选择用 flex . 涉及 :主轴  交叉轴
  * ==flex 需要知道子元素，使用时机为标签关闭前
  * 
  * 9.收集元素进行（hang）
  * ==根据主轴尺寸，把元素分进行
  * ==若设置了no-wrap,强行分配进第一行
  * 
  * 10.排版 | 计算主轴
  * ==找出所有 flex 元素
  * ==把主轴方向的剩余尺寸按比例分配给这些元素
  * ==若剩余空间为负数，所有flex元素为0，等比压缩剩余元素
  * ==没有 flex 元素，根据 justification 来计算每个元素的位置
  * 
  * 11.排版 | 交叉轴
  * ==根据每一行最大尺寸元素计算行高
  * ==根据行高flexAlign 和 itemAlign 确定元素的具体位置
  * 
  * 12 绘制
 */



const css = require('css')  //node 
const EOF = Symbol("EOF"); //EOF End of file
const layout = require("./layout.js")

let currentToken = null
let currentAttribute = null

let stack = [{type:'document',children:[]}]; // 如果写了一个配对良好的html片段 最后整个栈是空的  不方便最后把这棵树拿出来,特增加初始节点
let currentTextNode = null  // 文本节点

//  加入新的函数 addCSSRules,这里我们把CSS规则暂存到一个数组里
let rules = [];
function addCSSRules (text){
    var ast = css.parse(text);
    rules.push(...ast.stylesheet.rules)
}

// 计算选择器与元素匹配
// .a |  #a  | div  | div.a#a   假设没有多个class
function match(element,selector){
    if(!selector || !element.attributes){
        return
    }

    if(selector.charAt(0) == "#"){
        let attr = element.attributes.filter(attr.name ==='id')[0]
        if(attr && attr.value === selector.replace("#",'')){
            return true
        }
    }else if(selector.charAt(0) == "."){
        // 应该用空格 做分割,有一个匹配到 就应该返回true
        let attr = element.attributes.filter(attr.name ==='class')[0]
        if(attr && attr.value === selector.replace(".",'')){
            return true
        }
    }else{
        if(element.tagName === selector){
            return true
        }
    }
    return false
}

function specificity(selector){
    let p = [0,0,0,0];
    let selectorParts = selector.split(" ");
    for(let part of selectorParts){
        if(part.charAt[0] == "#"){
            p[1] +=1
        }else if(part.charAt[0] == "."){
            p[2] +=1
        }else{
            p[3] +=1
        }
    }
}

function compare(sp1,sp2){
    if(sp1[0] - sp2[0]){
       return sp1[0] - sp2[0]
    }
    if(sp1[1] - sp2[1]){
        return sp1[1] - sp2[1]
     }
     if(sp1[2] - sp2[2]){
        return sp1[2] - sp2[2]
     }
     return sp1[3] - sp2[3]
    
}

function computeCSS(element){
   var elements = stack.slice().reverse()  // slice 不传参数 返回全部,为防止后续变化的污染 做slice,   reverse :从当前元素 开始逐级的往外匹配
   if(!element.computedStyle){ //判断是否匹配,保存 css 设置的属性
        element.computedStyle = {}
   }

   for(let rule of rules){
    //    不考虑复合形选择器
       var selectorParts = rule.selecors[0].split(" ").reverse() // 和elements 元素保持顺序一致
       if(!match(element,selectorParts[0])){ // 简单选择器的第1个元素应该是当前元素
           continue
       }

       let matched = false;
        //    双循环选择器和元素的父元素来去找到是否可以进行匹配
       var j =1; // 当前选择器的位置
       for(var i =0; i <elements.length; i++){ // i 表示当前元素的位置
            if(match(elements[i],selectorParts[j])){
                j++  //元素能够匹配到一个选择器  j 自增
            }
       }
        //    结束时,检查是否所有选择器已经都被匹配到了  (其实检查到body 就够了,毕竟外边的也不支持了)
       if(j>=selectorParts.length){
           matched = true;
       }

       if(matched){
        //    简单抄写,未作优先级处理
        //  let computedStyle = element.computedStyle;
        //  for(let declaration of rule.declarations){
        //      if(!computedStyle[declaration.property]){
        //          computedStyle[declaration.property] = {}
        //      }
        //      computedStyle[declaration.property].value = declaration.value
        //  }
            let sp = specificity(rule.selecors[0]);
            let computedStyle = element.computedStyle;
            for(let declaration of rule.declarations){
                if(!computedStyle[declaration.property]){
                    computedStyle[declaration.property] = {}
                }
                if(!computedStyle[declaration.property].specificity){
                    computedStyle[declaration.property].value = declaration.value
                    computedStyle[declaration.property].specificity = sp
                }else if(compare(computedStyle[declaration.property].specificity,sp) < 0){
                    computedStyle[declaration.property].value = declaration.value
                    computedStyle[declaration.property].specificity = sp
                }
            }
       }

   }
}


function emit(token){
    let top = stack[stack.length - 1]

    if(token.type == "startTag"){ 
        let element = {
            type: 'element',
            children:[],
            attributes:[]
        };

        element.tagName = token.tagName;
        for(let p in token){
            if(p !=='type' && p !=='tagName'){
                element.attributes.push({
                    name:p,
                    value:token[p]
                });
            }
        }

        computeCSS(element)

        top.children.push(element)
        element.parent = top;
        if(!token.isSelfClosing){
            stack.push(element)
        }
        currentTextNode = null
    }else if(token.type == "endTag"){
        if(top.tagName !== token.tagName){
            throw new Error("Tag start end doesn't match !" );  // 理论上应该容错,
        }else {
            // =======遇到 style  标签时,执行增加 css 规则的操作=============== 只考虑 style 标签 和 内联写法
            if(top.tagName == "style"){
                addCSSRules(top.children[0].content)
            }
            layout(top); 
            stack.pop()
        }
        currentTextNode = null
    }else if(token.type == "text"){
        if(currentTextNode == null){
            currentTextNode = {
                type:'text',
                content:''
            }
            top.children.push(currentTextNode)
        }
        currentTextNode.content += token.content
    }
 
}


function data (c){
    if(c == "<"){
        // 标签开始
        return tagOpen;
    }else if(c==EOF){
       emit({
           type:'EOF'
       });
       return
    }else{
        // 文本节点
        emit({
            type:'text',
            content:c
        });
        return data;
    }
}

function tagOpen(c){
    // 可能为: 开始标签 | 结束标签  | 自封闭标签
    // 结束标签特点:紧跟一个 / 
    if(c=="/"){ 
        return endTagOpen;
    }else if(c.match(/^[a-zA-z]$/)){
        currentToken = {
            type:'startTag',
            tagName:''
        }
        return tagName(c)
    }else{
        return
    }
}

function endTagOpen(c){
    if(c.match(/^[a-zA-z]$/)){
        currentToken = {
            type:'endTag',
            tagName:''
        }
        return tagName(c)
    }else if(c == '>'){
// 报错
    }else if(c == EOF){
// 报错
    }else {

    }
}

function tagName(c){
    // tagName 肯定是以空白符结束的,在HTML里 有效的空白符: tab | 换行 | prohibited | 空格
     if(c.match(/^[\t\n\f ]$/)){ 
        //  <html props
        return beforeAttributeName;
    }else if(c == '/'){
        // <html/
        return selfClosingStartTag
    }else if(c.match(/^[a-zA-Z]$/)){
        currentToken.tagName+=c
        return tagName;
    }else if(c== ">"){
        emit(currentToken)
        return data
    }else{
        return tagName
    }
}

// <html aaa=
function beforeAttributeName(c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName
    }else if(c== "/" || c== ">" || c==EOF){
        return afterAttributeName(c);
    }else if(c== "="){
        // return beforeAttributeName
    }else{
        // return beforeAttributeName
        currentAttribute = {
            name:'',
            value:''
        }
        return attributeName(c)
    }
}


function attributeName(c){
    if(c.match(/^[\t\n\f ]$/) || c== '/' || c=='>'|| c==EOF){
        return afterAttributeName(c)
    }else if(c =='='){
        return beforeAttributeValue
    }else if(c=='\u0000'){

    }else if(c=="\"" || c=="'" || c=="<"){

    }else {
        currentAttribute.name += c;
        return attributeName
    }
}

function beforeAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/) || c=="/" || c==">" || c==EOF){
        return beforeAttributeValue
    }else if(c=="\""){
        return doubleQuotedAttributeValue;
    }else if(c=="\'"){
        return singleQuotedAttributeValue;
    }else if(c==">"){
      // return data
    }else{
        return unquotedAttributeValue(c)
    }
}

function doubleQuotedAttributeValue(c){
    if(c=="\""){
       currentToken[currentAttribute.name] = currentAttribute.value
    }else if(c=="\u0000"){

    }else if(c==EOF){

    }else{
        currentAttribute.value += c;
        return doubleQuotedAttributeValue
    }
}

function singleQuotedAttributeValue(c){
    if(c=="\'"){
        currentToken[currentAttribute.name] = currentAttribute.value
     }else if(c=="\u0000"){
 
     }else if(c==EOF){
 
     }else{
         currentAttribute.value += c;
         return singleQuotedAttributeValue
     }
}

function unquotedAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/)){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName
    }else if(c=="/"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag
    }else if(c==">"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken)
        return data
    }else if(c =="\u0000"){

    }else if(c =="\"" || c=="\'" || c=="<" || c=="="||c=="`"){
        
    }else if(c ==EOF){

    }else {
        currentAttribute.value += c
        return unquotedAttributeValue
    }
}



function selfClosingStartTag (c){
    if(c == ">"){
        currentToken.isSelfClosing = true;
        return data;
    }else if(c == EOF){

    }else{  

    }
}



module.exports.parseHTML = function parseHTML(html){
    let state = data;
    for(let c of html){
        state = state(c)
    }
    state = state(EOF)
}