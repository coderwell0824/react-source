@typescript-eslint/eslint-plugin ts-eslint插件

---

第二节:

React项目结构
React(宿主环境无关的公用方法)
React-reconciler(协调器的实现, 宿主环境无关)
各种宿主环境的包
shared(公用辅助方法, 宿主环境无关)

jsx转换
包括两部分:
编译时: 由babel处理
运行时: jsx方法或React.createElement方法的实现(包括dev, prod两个环境)

编译时由babel编译实现, 我们来实现运行时, 主要工作包括:

1. 实现jsx方法
2. 实现打包流程
3. 实现调试打包结果的环境
   实现jsx方法
   包括:
   jsxDEV方法(dev环境)
   jsx方法(prod环境)
   React.createElement方法(class组件)

实现打包流程
对应上述3个方法, 打包对应文件:
react/jsx-dev-runtime.js(dev环境)
react/jsx-runtime.js(prod环境)
React

调试打包结果: --使用pnpm link

这种方式的优点: 可以模拟实际项目引用React的情况
缺点: 对于我们当前开发项目来说, 略显繁琐, 对于开发过程中, 更期望的是热更新效果

pnpm link react --global

---

初探Reconciler
Reconciler是React核心逻辑所在的模块, 中文名叫协调器, 协调(reconcile)就是diff算法的意思

核心模块消费JSX的过程:
当前已知的数据结构: React Element

React Element如果作为核心模块操作的数据结构, 存在的问题: 1.无法表达节点之间的关系2.字段有限, 不好扩展(比如: 无法表达状态)
所以, 需要一种新的数据结构, 他的特点: 1.介于React Element与真实UI节点之间2.能够表达节点之间的关系3.方便扩展(不仅作为数据存储单元, 也能作为工作单元)
这就是FiberNode(虚拟DOM在React中的实现)
当前我们了解的节点类型:
1.JSX 2. React Element 3. FiberNode 4.DOM Element

Reconciler的工作方式
对于同一节点, 比较其React Element与fiberNode, 生成子fiberNode. 并根据比较的结果生成不同的标记(插入, 删除, 移动), 对应不同宿主环境API的执行

当所有React Element比较完后, 会生成一棵fiberNode树, 一共会存在两棵fiberNode树:
current: 与视图中真实UI对应的fiberNode树
workInProgress: 触发更新后, 正在reconciler中计算的fiberNode树

JSX的消费顺序
以DFS(深度优先遍历)的顺序遍历React Element. 这意味着:

1. 如果有子节点, 遍历子节点
2. 如果没有子节点, 遍历兄弟节点

这是个递归的过程, 存在递,归两个阶段:
递: 对应beginWork
归: 对应completeWork

---
