##### css 2.1 语法
#####https://wwww.w3.org/TR/CSS21/grammar.html#q25.0
#####https://wwww.w3.org/TR/css-syntax-3

##### css 总体规则
- @charset
- @import
- rules
   - @media
   - @page
   - rule

##### 选择器语法
#####简单选择器
- "*号"
- div svg|a  类型选择器  (| 空间选择)
- .cls
- "#id"
- [attr = value] (~  |)
- :hover
- ::before

#####复合选择器
- <简单选择器><简单选择器><简单选择器>
- 要求：* 或者div 必须写在最前面
- 要求：伪类 伪元素一定要写在最后面

#####复杂选择器  （复合选择器 中间用连接符）
- <复合选择器> <sp> <复合选择器>    空格分隔： 子孙选择器
- <复合选择器> ">" <复合选择器>     直接子级
- <复合选择器> "~" <复合选择器>     邻接关系
- <复合选择器> "+" <复合选择器>     邻接关系
- <复合选择器> "||" <复合选择器>    selector level  4  表格 table 选择某一列

#####选择器优先级

#####伪类
- 链接/行为
   - :any-link  (any-link 匹配任何的超链接, link 未访问过的超链接)
   - :link:visited   已访问过的超链接
   - :hover
   - :active
   - :focus
   - :target  a 标签使用
  
- 树结构
   - :empty  是否有子元素
   - :nth-child()   可以写表达式
   - :nth-last-child()  从后往前数
   - :first-child   :last-child    :only-child

- 逻辑型
   - :not 伪类
   - :where    :has   (level 4)

#####伪元素
- ::before  (生成 content 属性)
- ::after   (生成 content 属性)
- ::first-line   （原本已有content   排版的第一行，不同显示器 可能不一样）
   - font系列
   - color系列
   - background系列
   - word-spacing
   - letter-spacing
   - text-decoration
   - text-transform
   - line-height
- ::first-letter （原本已有content）
   - font系列
   - color系列
   - background系列
   - word-spacing
   - letter-spacing
   - text-decoration
   - text-transform
   - line-height
   - float
   - vertical-align
   - 盒模型系列 margin padding border
