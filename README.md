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
3.  pnpm link --global

---

第七课 初探FC与实现第二种调试方式
FunctionComponent需要考虑的问题:
如何支持FC?
如何组织Hooks

如何支持FC?
FC的工作同样根植于beginWork, completeWork

第二种调试方式
采用Vite的实时调试, 他的好处是实时看到源码运行效果

---

第八课 实现useState
hook脱离FC上下文, 仅仅是普通函数, 如何让他拥有感知上下文环境的能力?
比如说:
hook如何知道在另一个hook的上下文环境内执行

function App(){

useEffect(()=>{
useState(0)
})
}
hook怎么知道当前是mount还是update
解决方案: 在不同上下文中调用的hook不是同一个函数
在mount和update不同的阶段时, 创建不同的函数上下文环境, 在reconciler中实现, 并在数据内部共享当前使用的hooks集合, 通过React使用

实现内部数据共享层时的注意事项:
以浏览器为例, Reconciler + hostConfig = ReactDOM
增加内部数据共享层, 意味着Reconciler与React产生关联, 进而意味着ReactDOM与React产生关联
如果两个包产生关联, 在打包时需要考虑: 两者的代码是打包在一起还是分开?
如果打包在一起, 意味着打包后的ReactDOM中会包含React的代码, 那么ReactDOM中会包含一个内部数据共享层, React中也会包含一个内部数据共享层, 这两者不是同一个内部数据共享层

而我们希望两者共享数据, 所以不希望ReactDOM中会包含React的代码

hook如何知道自身数据保存在哪里
可以记录当前正在render的FC对应fiberNode, 在fiberNode中保存hook数据

实现Hooks的数据结构
fiberNode中可用的字段:

1. memoizedState
2. updateQueue

对于FC对应的fiberNode, 存在两层数据:

1. fiberNode.memoizedState中存储对应Hooks链表(每次调用是调用顺序不能不变的)
2. 链表中每个Hook对应自身的数据

实现useState包括两方面工作:

1. 实现mount时useState的实现
2. 实现dispatch方法, 并接入现有更新流程内

//commit阶段开始时为FiberRootNode

---

第九课 ReactElement的测试用例
本节课我们将实现第三种调试方法 --- 用例调试, 包括三部分内容:

1. 实现一个测试工具test-utils
2. 实现测试环境
3. 实现ReactElement用例

与测试用例相关的代码都来自React仓库, 可以先把React仓库下载下来:
git clone

实现test-utils
这是用于测试的工具集, 来源自ReactTestUtils.js, 特点是ReactDOM作为宿主环境

实现测试环境

pnpm i -D -w jest jest-config jest-environment-jsdom

配置文件见jest.config.js

实现ReactElement用例
来源自ReactElement-test.js, 直接复制下面的代码到同名文件:
xxx

为jest增加jsx解析能力, 安装babel:
pnpm i -D -w @babel/core @babel/preset-env @babel/plugin-transform-react-jsx

新增babel.config.js

---

第10课 初探update流程
update流程与mount流程的区别:

对于beginWork:

1. 需要处理ChildDeletion的情况
2. 需要处理节点移动的情况(abc -> bca)

对于complateWork:

1. 需要处理HostText内容更新的情况
2. 需要处理HostComponent属性变化的情况

对于commitWork:

1. 对于ChildDeletion需要遍历被删除的子树

对于useState:
实现相对于mountState的updateState

beginWork流程
本节课仅处理单一节点, 所以省去了[节点移动]的情况, 我们需要处理:

1. singleElement
2. singleTextNode

处理流程为:

1. 比较是否可以复用current fiber
   a. 比较key, 如果key不同, 不能复用
   b. 比较type, 如果type不同, 不能复用
   c. 如果key和type都相同, 则可复用

2. 不能复用, 则创建新的(同mount流程), 可以复用则复用旧的

注意: 对于同一个fiberNode, 即使反复更新, curent, wip这两个fiberNode会重复使用

completeWork流程
主要处理[标记Update]的情况, 本节课我们处理HostText内容更新的情况

commitWork流程
对于标记ChildDeletion的子树, 由于子树中:

1. 对于FC, 需要处理useEffect unmount执行, 解绑ref
2. 对于HostComponent, 需要解绑ref
3. 对于子树的[根HostComponent], 需要移除DOM

所以需要实现[遍历ChildDeletion子树]的流程

对于useState需要实现:

1. 针对update的dispatcher
2. 实现对标mountWorkInProgressHook的updateWorkInProgressHook
3. 实现updateState中计算新state的逻辑

其中updateWorkInProgressHook的实现需要考虑的问题:

1. hook数据从哪来? ->currentHook
2. 交互阶段触发的更新
3. render阶段触发的更新

---

第11课 实现事件系统

事件系统本质上根植于浏览器事件模型, 所以它隶属于ReactDOM, 在实现时要做到对Reconciler 零侵入
实现事件系统需要考虑:

1.  模拟实现浏览器事件捕获, 冒泡流程
2.  实现合成事件对象
3.  方便后续扩展

实现ReactDOM与Reconciler对接
将事件回调保存在DOM中, 通过以下两个时机对接:

1. 创建DOM时
2. 更新属性时

模拟实现浏览器事件流程

---

第12课 实现Diff算法

1. 单节点Diff算法
   当前仅实现了单一节点的增删操作, 即单节点Diff算法, 下节课实现多节点的Diff算法
   对于reconcileSingElement的改动
   当前支持的情况:
   A1 -> B1
   A1 -> A2

需要支持的情况:
ABC -> A
[单/多节点]是更新后是单/多节点
更细致的, 我们需要区分4种情况:

1. key相同, type相同 --> 复用当前节点
   例如: A1B2C3 -> A1

2. key相同, type不同 --> 不存在任何复用的可能性
   例如: A1B2C3 -> B1

3. key不同, type相同 --> 当前节点不能复用
4. key不同, type不同 --> 当前节点不能复用

对于reconcileSingleTextNode的改动
类似reconcileSingElement

对于同级多节点Diff的支持
单节点需要支持的情况:

1. 插入Placement
2. 删除ChildDeletion

多节点需要支持的情况:

1. 插入Placement
2. 删除ChildDeletion
3. 移动Placement

整体流程分为4步:

1. 将current中所有同级fiber保存在Map中
2. 遍历newChild数组, 对于每个遍历到的element, 存在两种情况:
   a. 在Map中存在对应currentFiber, 且可以复用
   b. 在Map中不存在对应curentFiber, 或不能复用
3. 判断是插入还是移动
4. 最后Map中剩下的都是标记删除

步骤2: 是否复用详解
首先, 根据key从Map中获取currentFiber, 如果不存在currentFiber, 则没有复用的可能
接下来, 分情况谈论:

1.  element是HostText, currentFiber是么?
2.  element是其他ReactElement, currentFiber是么?
3.  TODO element是数组或Fragment, currentFiber是么?

步骤3: 插入/移动判断详解

移动具体是指向右移动
移动的判断依据: element的index与[element对应currentFiber]index的比较
A1B2C3 -> B2C3A1
0 1 2 -> 0 1 2
当遍历element时, [当前遍历到的element]一定是[所有已遍历的element]中最靠右的那个

所以只需要记录最后一个可复用fiber在current中的index(lastPlacedIndex),在接下来的遍历中:

1.  如果接下来遍历到的可复用fiber的index < lastPlacedIndex, 则标记Placement
2.  否则, 不标记

移动操作的执行
Placement同时对应:

1. 移动
2. 插入操作

对于插入操作, 之前对应DOM方法是parentNode.appendChild, 现在为了实现移动操作, 需要支持parent.insertBefore

parent.insertBefore需要找到目标兄弟Host节点, 要考虑两个因素:

1. 可能并不是目标fiber的直接兄弟节点
   组件之间存在嵌套关系
2. 不稳定的Host节点不能作为[目标兄弟Host节点]

不足:

1.  不支持数组与Fragement

---

第13课 实现Fragment

为了提高组件结构灵活性, 需要实现Fragment, 具体来说, 需要区分几种情况:

1. Fragment包裹其他组件
   type为Fragment的ReactElement, 对单一节点的Diff需要考虑Fragment情况
2. Fragment与其他组件同级
   children为数组类型, 则进入reconcileChildrenArray方法, 数组中的某一项为Fragment, 所以需要增加[type为Fragment的ReactElement的判断],
   同时beginWork需要增加Fragment类型的判断
3. 数组形式的Fragment
   children为数组类型, 则进入reconcileChildrenArray方法, 数组中的某一项为数组, 所以需要增加[数组类型的判断]

Fragment对ChildDeletion的影响
childDeletion删除DOM的逻辑:

1. 找到子树的根Host节点
2. 找到子树对应的父级Host节点
3. 从父级Host节点中删除子树根Host节点

考虑删除p节点情况:

<div>
   <p>xxxx</p>
</div>
考虑删除Fragment后, 子树的根Host节点可能存在多个:
<div>
   <>
   <p>11111</p>
   <p>222222</p>
   </>
</div>

对React的影响
React包需要导出Fragment, 用于JSX转换引入Fragment类型

---

第14课 实现同步调度流程
更新到底是同步还是异步的?
当前的现状:

1. 从触发更新到render, 再到commit都是同步的
2. 多次触发更新会重复多次更新流程

可以改进的地方: 多次触发更新, 只进行一次更新流程
[Batched Updates(批处理)]--多次触发更新, 只进行一次更新流程
将多次更新合并为一次, 理念上有点类似防抖, 节流, 我们需要考虑合并的时机是:

1. 宏任务
2. 微任务

用三款框架实现Batched Updates, 打印结果不同, 结论: React批处理的时机既有宏任务, 也有微任务, 本节课我们来实现[微任务的批处理]
React是并发更新时(startTransition)使用的是宏任务, Vue和Selvte是微任务, React默认是微任务

新增调度阶段
即然我们需要[多次触发更新, 只进行一次更新流程],意味着我们要将更新合并, 所以在需要在render阶段和commit阶段的基础上增加schedule阶段(调度阶段)

需要在scheduleUpdateFiber函数执行renderRoot的中间加上调度阶段

[多次触发更新, 只进行一次更新流程]中多次触发更新意味着对于同一个fiber, 会创建多个update
多次触发更新, 只进行一次更新流程, 意味着要达成3个目标:

1. 需要实现一套优先级机制, 每个更新都拥有优先级
2. 需要能够合并一个宏任务/微任务中触发的所有更新
3. 需要一套算法, 用于决定哪个优先级优先进入render阶段

实现目标1: Lane模型
包括:

1.  lane(二进制位, 代表优先级)
2.  lanes(二进制位, 代表lanes的集合)

其中:

1. lane作为update的优先级
2. lanes作为lane的集合

lane的产生
对于不同情况触发的更新, 产生lane, 为后续不同事件产生不同优先级更新做准备
如何知道哪些lane被消费, 还剩哪些lane没被消费

对FiberRootNode的改造
需要增加如下字段:

1. 代表所有未被消费的lane的集合
2. 代表本次更新消费的lane

实现目标2,3
需要完成两件事:

1. 实现某些判断机制, 选出一个lane
2. 实现类似防抖, 节流的效果, 合并宏/微任务重触发的更新

render阶段的改造
processUpdateQueue方法消费update时需要考虑:

1.  lane的因素
2.  update现在是一个链表, 需要遍历

commit阶段的改造
移除[本次更新被消费的lane]

---

第15课 实现useEffect
实现useEffect需要考虑的问题:

1. effect数据结构

2. effect的工作流程如何接入现有流程
