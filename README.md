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

第四课 如何触发更新
常见的触发更新的方式:
ReactDOM.createRoot().render(或老版的ReactDOM.render)
this.setState
useState的dispatch方法

我们希望实现一套统一的更新机制, 他的特点是:
兼容上述触发更新的方式
方便后续扩展(优先级机制...)

更新机制的组成部分
代表更新的数据结构---Update(shared.pending中可能有多个Update结构)
消费Update的数据结构 ---UpdateQueue

接下来的工作包括:
实现mount时调用的API
将该API接入上述更新机制中

需要考虑的事情:
更新可能发生于任意组件, 而更新流程时从根节点递归的
需要一个统一的根节点保存通用信息 --这个就是HostRootFiber

---

第五课 初探mount流程
更新流程的目的:
生成wip fiberNode树
标记副作用flags

更新流程的步骤:
递: beginWork
归: completeWork

beginWork
对于如下结构的ReactElement:
<A>
<B/>
</A>
当进入A的beginWork时, 通过对比B current fiberNode与B reactElement生成B对应Wip fiberNode
在此过程中最多会标记两类与结构变化的相关的flags:
Placement
插入: a ->ab 移动: abc -> bca
ChildDetetion:
删除: ul > li _ 3 ul> li _ 1
不包含与属性变化的相关的flag:
Update
<img title="鸡" /> -> <img title="鸭" />

实现与Host相关节点的beginWork
首先, 为开发环境增加**DEV**标识, 方便Dev包打印更多信息:
pnpm i

HostRoot的beginWork工作流程: 1.计算状态的最新值2.创建子fiberNode

HostComponent的beginWork工作流程: 1.创建子fiberNode
HostText没有beginWork工作流程(因为他没有子节点), 递阶段遍历到HostText阶段时开始归阶段

beginWork性能优化策略
考虑如下结构的reactElement:

<div>
   <p> 练习时长 </p>
   <span> 两年半 </span>
</div>
理论上mount流程完毕后包含的flags:
   两年半 Placement
   span Placement
   练习时长 Placement
   p Placement
   div Placement

相比于执行5次Placement, 我们可以构建好[离屏DOM树]后, 对div执行1次Placement操作

completeWork需要解决的问题: 1.对于Host类型的fiberNode: 构建离屏DOM树2.标记Update flag(TODO)

completeWork性能优化策略
flags分布在不同的fiberNode中, 如何快速找到他们?
就是利用completeWork向上遍历(归)的流程, 将子fiberNode的flags冒泡到父fiberNode中

---

第六课 初探ReactDOM

React内部3个阶段:

1.  schedule阶段
2.  render阶段(beginWork和completeWork)
3.  commit阶段(commitWork)

commit阶段的3个子阶段:

1.  beforeMutation阶段
2.  mutation阶段
3.  layout阶段

mutation是突变的意思, 突变是一种操作UI的方式, 它是指将一个属性直接从一个值变为另一个值,DOM API的工作方式就是突变,
比如说我们可以比如说我们可以将一个dom节点的style下的color从红色直接变为绿色，这就是突变.
那么在突变之前的阶段就叫做before mutation，也就是突变之前的阶段，那突变之后的阶段其实按理说应该叫after mutation，
但是因为像我们的useLayoutEffect这么一个hooks就是在after mutation阶段执行的，所以说这个阶段被称为layout阶段。

当前commit阶段要执行的任务

1.  fiber树的切换
2.  执行Placement对应操作

需要注意的问题是考虑如下JSX. 如果span含有flag, 该如何找到它:
<App>

   <div>
      <span>22</span>
   </div>
</App>

打包ReactDOM
需要注意的点:

1.  兼容原版React的导出
2.  处理hostConfig的导出

---

pnpm link --global
