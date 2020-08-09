function getStyle(element){
    if(!element.style){
        element.style = {};
    }

    for(let prop in element.computedStyle){
        let p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value 


        // px 转换成数字
        if(element.style[prop].toString().match(/^px$/)){ 
            element.style[prop] = parseInt(element.style[prop]);
        }
        // 纯数字转换下类型
        if(element.style[prop].toString().match(/^[0-9\.]+$/)){
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style
}


function layout (element){
    if(!element.computedStyle){
        return;
    }
    let elementStyle = getStyle(element);

    if(elementStyle.display !== 'flex'){
        return
    }
    // 过滤文本节点
    let items = element.children.filter(e=>e.type === "element")
    // sort 为了支持 order 属性
    items.sort(function(a,b){
        return (a.order || 0) - (b.order || 0)
    })

    let style = elementStyle

    ['width','height'].forEach(size => {
        if(style[size] === "auto" || style[size] === " "){
            style[size] = null
        }
    });

    if(!style.flexDirection || style.flexDirection === "auto"){
        style.flexDirection = "row"
    }
    if(!style.alignItems || style.alignItems === "auto"){
        style.alignItems = "stretch"
    }
    if(!style.justifyContent || style.justifyContent === "auto"){
        style.justifyContent = "flex-start"
    }
    if(!style.flexWrap || style.flexWrap === "auto"){
        style.flexWrap = "nowrap"
    }
    if(!style.alignContent || style.alignContent === "auto"){
        style.alignContent = "stretch"
    }

    let mainSize,mainStart,mainEnd,mainSign,mainBase,crossSize,crossStart,crossEnd,crossSign,crossBase;
    if(style.flexDirection === 'row'){
        mainSize = 'width';
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if(style.flexDirection === 'row-reverse'){
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = -1;
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if(style.flexDirection === 'column'){
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    if(style.flexDirection === 'row-reverse'){
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'top';
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    if(style.flexWrap === 'wrap-reverse'){  //反向换行
      let tmp = crossStart;
      crossStart = crossEnd;
      crossEnd = tmp;
      crossSign = -1
    }else{
        crossBase = 0;
        crossSign = 1
    }
    let isAutoMainSize = false;
    if(!style[mainSize]){ // auto sizing
        elementStyle[mainSize] = 0;
        // 这段代码显示不全，自己编的=====开始
        for(let i = 0;i<items.length; i++){
            let item = items[i];
            if(item[mainSize] !== null || item[mainSize]> 0){
                elementStyle[mainSize] = elementStyle[mainSize] + item[mainSize]
            }
        }
        isAutoMainSize = true
         // 这段代码显示不全，自己编的=====结束
    }

    let flexLine = []
    let flexLines = [flexLine]
    let mainSpace = elementStyle[mainSize];
    let crossSpace = 0;

    for(let i=0;i<items.length;i++){
        let item = items[i];
        let itemStyle = getStyle(item);

        if(itemStyle[mainSize] === null){
            itemStyle[mainSize] = 0
        }

        if(itemStyle.flex){
            flexLine.push(item)
        }else if(style.flexWrap === 'nowrap' && isAutoMainSize){
            mainSpace -= itemStyle[mainSize]
            if(itemStyle[crossSize] !==null && itemStyle[crossSize] !== (void 0)){
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item)
        }else{
            // 元素尺寸大于 父元素尺寸，将强制转为父元素尺寸
            if(itemStyle[mainSize] > style[mainSize]){
                itemStyle[mainSize] = style[mainSize]
            }
            // 剩余空间不足以放下一个子元素
            if(mainSpace < itemStyle[mainSize]){
                // 记录下实际剩余尺寸和实际占用尺寸
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                // 创建新行，重置尺寸
                flexLine = [item]
                flexLines.push(flexLine)
                mainSpace = style[mainSize]
                crossSpace = 0
            }else{
                flexLine.push(item)
            }

            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)){
                crossSpace = Math.max(crossSpace,itemStyle[crossSize])
            }
            mainSpace -=itemStyle[mainSize]
        }
    }
    flexLine.mainSpace = mainSpace
    //  根据 flex 属性去分配剩余空间
    if(style.flexWrap === "nowrap" || isAutoMainSize){
        flexLine.crossSpace = (style[crossSize]!==undefined) ? style[crossSize]: crossSpace;
    }else{
        flexLine.crossSpace = crossSpace
    }
    if(mainSize < 0){
        //  overflow (happens only if container is single line), scale every item
        let scale = style[mainSize] / (style[mainSize] - mainSpace)
        let currentMain = mainBase;
        for(let i = 0;i<items.length;i++){
            let item = items[i];
            let itemStyle = getStyle(item);
            if(itemStyle.flex){ //flex 没有权利参加等比压缩     为啥？？？
                itemStyle[mainSize] = 0
            }
            itemStyle[mainSize] = itemStyle[mainSize] * scale;
            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign + itemStyle[mainSize];
            currentMain = itemStyle[mainEnd]
        }
    }else{
    //  process each flex line
        flexLines.forEach(function(items){
            let mainSpace = items.mainSpace;
            let flexTotal = 0;
            for(let i = 0; i<items.length;i++){
                let item = items[i];
                itemStyle = getStyle(item);
                if((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))){
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }
            if(flexTotal > 0){
                // there is flexible flex items
                let currentMain = mainBase;
                for(let i = 0; i<items.length;i++){
                    let item = items[i];
                    itemStyle = getStyle(item);
                    if(itemStyle.flex){
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign + itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd]
                }
            }else{
                // there is no flexible flex items,which means,justifyContent shoud work
                let  currentMain,step;
                if(style.justifyContent === "flex-start"){
                    currentMain = mainBase;
                    step = 0
                }
                if(style.justifyContent === "flex-end"){
                    currentMain = mainSpace * mainSign + mainBase;
                    step = 0
                }
                if(style.justifyContent === "center"){
                    currentMain = mainSpace  / 2 * mainSign + mainBase;
                    step = 0
                }
                if(style.justifyContent === "space-between"){
                    currentMain = mainBase
                    step = mainSpace / (items.length -1) * mainSign
                }
                if(style.justifyContent === "space-around"){
                    step = mainSpace / items.length * mainSign
                    currentMain = step /2 + mainBase
                }
                for(let i = 0; i<items.length;i++){
                    let item = items[i];
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        })
    }


    // 交叉轴   复用 变量 crossSpace \ step
    // align-items align-self
    if(!style[crossSize]){ //auto sizing
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        for(let i=0;i<items.length;i++){
            elementStyle[crossSize] = elementStyle[crossSize] + flexLines[i].crossSpace
        }
    }else{
        crossSpace = style[crossSize]
        for(let i=0;i<items.length;i++){
            crossSpace -= flexLines[i].crossSpace
        }
    }

    if(style.flexWrap === "wrap-reverse"){
        crossBase = style[crossSize]
    }else{
        crossBase = 0
    }

    let lineSize = style[crossSize] / flexLines.length;
    
    if(style.alignContent === "flex-start"){
        crossBase = 0;
        step = 0;
    }
    if(style.alignContent === "flex-end"){
        crossBase += crossSign * crossSpace;
        step = 0;
    }
    if(style.alignContent === "center"){
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }
    if(style.alignContent === "space-between"){
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }
    if(style.alignContent === "space-around"){
        step = crossSpace / flexLines.length;
        crossBase += crossSign * step / 2;
    }
    if(style.alignContent === "stretch"){
        crossBase += 0;
        step = 0;
    }
    flexLines.forEach(function(items){
        let lineCrossSize = style.alignContent === "stretch" ?
        items.crossSpace + crossSpace / flexLines.length :
        items.crossSpace;

        for(let i=0;i<items.length;i++){
            let item = items[i];
            let itemStyle = getStyle(item);

            let align = itemStyle.alignSelf || itemStyle.alignItems;

            if(item === null){
                itemStyle[crossSize] = (align === "stretch") ? lineCrossSize : 0
            }
            if(align === 'flex-start'){
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            if(align === 'flex-end'){
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }
            if(align === 'center'){
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            if(align === 'stretch'){
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) ? itemStyle[crossSize]: lineCrossSize);
                
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart])
            }

        }
        crossBase += crossSign * (lineCrossSize + step)

    })

    


}

module.exports = layout