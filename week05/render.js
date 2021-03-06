const images = require('images');

//  单个元素绘制
// function render(viewport, element){
//     if(element.style){
//         var img = images(element.style.width,element.style.height);

//         if(element.style['background-color']){
//             let color = element.style['background-color'] || "rgb(0,0,0)";
//             color.natch(/rgb\((\d+),(\d+),(\d+)\)/);
//             img.fill(Number(RegExp.$1),Number(RegExp.$2),Number(RegExp.$3))
//             viewport.draw(img,element.style.left || 0,element.style.top || 0)
//         }
//     }
// }

function render(viewport, element){
    if(element.style){
        var img = images(element.style.width,element.style.height);

        if(element.style['background-color']){
            let color = element.style['background-color'] || "rgb(0,0,0)";
            color.natch(/rgb\((\d+),(\d+),(\d+)\)/);
            img.fill(Number(RegExp.$1),Number(RegExp.$2),Number(RegExp.$3))
            viewport.draw(img,element.style.left || 0,element.style.top || 0)
        }
    }

    if(element.children){
        for(let child of element.children){
            render(viewport,child)
        }
    }

}