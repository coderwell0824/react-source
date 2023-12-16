import { Dispatch, Dispatcher } from "react/src/curentDispatcher";
import { FiberNode } from "./fiber";
import internals from "shared/internals";
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate } from "./updateQueue";
import { Action } from "shared/ReactTypes";
import { scheduleUpdateFiber } from "./workLoop";

let currentlyRenderingFiber: FiberNode | null = null;  //当前正在渲染的fiber
let workInProgressHook: Hook | null = null//当前正在处理的hook
const { curentDispatcher } = internals;

//定义Hook结构
interface Hook {
  memoizedState: any; //每个hook存储的hook数据
  updateQueue: unknown;  //更新hook
  next: Hook | null     //指向下一个hook
}


//渲染hooks组件
export function renderWithHooks(wip: FiberNode) {

  //currentlyRenderingFiber赋值操作
  currentlyRenderingFiber = wip;
  wip.memoizedState = null; //赋值为null的原因是在接下来的hooks操作时会创建链表


  const current = wip.alternate; //取出当前的Fiber树
  if (current != null) {
    //update阶段

  } else {
    //mount阶段
    curentDispatcher.current = HooksDispatcherOnMount;  //curentDispatcher.current指向mount时的hook的实现

  }

  const Component = wip.type; //获取函数式组件的函数的位置
  const props = wip.pendingProps; //获取函数式组件上的props
  const children = Component(props);  //获取函数的jsx

  //currentlyRenderingFiber重置操作
  currentlyRenderingFiber = null;

  return children
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
  useEffct: "1111",
}

//mount时useState的实现
function mountState<State>(initialState: (() => State) | State): [State, Dispatch<State>] {
  //1. 找到当前useState对应的hook数据
  const hook = mountWorkInProgressHook()

  //2. 获取State
  let memoizedState: State
  if (initialState instanceof Function) {  //initialState为函数形式
    memoizedState = initialState()
  } else {
    memoizedState = initialState;
  }

  //3. useState可以触发更新, 我们为它创建一个updateQueue
  const queue = createUpdateQueue<State>();  //创建更新队列
  hook.updateQueue = queue; //将更新队列放到对应hook数据的更新队列中
  hook.memoizedState = memoizedState; //将数据保存在hook的memoizedState中

  //@ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber!, queue); //获取dispatch
  queue.dispatch = dispatch; //暴露dispatch


  return [memoizedState, dispatch]
}

//dispatchSetState: useState触发的dispatch    fiber: 当前的fiber, updateQueue: 当前hook的更新队列, action: 更新的操作
function dispatchSetState<State>(fiber: FiberNode, updateQueue: UpdateQueue<State>, action: Action<State>) {

  const update = createUpdate(action);  //创建一个update
  enqueueUpdate(updateQueue, update); //将update插入到updateQueue中
  scheduleUpdateFiber(fiber);   //触发更新流程
}





//获取在mount阶段时正在处理的hook
function mountWorkInProgressHook(): Hook {

  //1.在mount时我们要创建hook
  const hook: Hook = {
    memoizedState: null,
    next: null,
    updateQueue: null
  }

  if (workInProgressHook == null) {
    //在mount阶段并且是第一个hook
    if (currentlyRenderingFiber == null) {
      //说明hook不是在函数组件内执行的
      throw new Error("请在函数组件内调用hook")
    } else {
      //代表了这是mount时的第一个hook
      workInProgressHook = hook  //更新当前的hook为当前正在处理的hook
      currentlyRenderingFiber.memoizedState = workInProgressHook //更新memoizedState中hook数据
    }
  } else {
    //在mount阶段时第二个以下的hook
    workInProgressHook.next = hook;  //形成hook链表
    workInProgressHook = hook;    //更新当前的hook为当前正在处理的hook
  }

  return workInProgressHook;
}