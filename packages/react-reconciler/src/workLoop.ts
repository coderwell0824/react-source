import { scheduleMicroTask } from "hostConfig";
import { beginWork } from "./beginWork";
import { commitMutationEffects } from "./commitWork";
import { completeWork } from "./completeWork";
import { FiberNode, FiberRootNode, PendingPassiveEffect, createWorkInProgress, markRootFinished } from "./fiber";
import { Flags, MutationMark, NoFlags, PassiveMask } from "./fiberFlags";
import { Lane, NoLane, SyncLane, getHighestPriorityLane, mergeLanes } from "./fiberLanes";
import { flushSyncCallbacks, scheduleSyncCallback } from "./syncTaskQueue";
import { HostRoot } from "./workTags";
import { unstable_scheduleCallback as scheduleCallback, unstable_NormalPriority as NormalPriority } from "scheduler";
import { Effect } from "./fiberHook";
import { HookHasEffect, Passive } from "./hookEffectTags";

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;  //保存本次更新的lane
let rootDoesHasPassiveEffects: boolean = false;  //是否执行effect副作用

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
  workInProgress = createWorkInProgress(root.current, {});
  wipRootRenderLane = lane
}

//调度更新Fiber
export function scheduleUpdateFiber(fiber: FiberNode, lane: Lane) {
  const root = markUpdateFromFiberToRoot(fiber);
  markRootUpdated(root, lane)
  // renderRoot(root);
  ensureRootIsScheduled(root);
}

//确保fiberRootNode在调度阶段 调度阶段入口
function ensureRootIsScheduled(root: FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.pendingLanes); //获取当前更新的lane

  //updateLane等于NoLane说明没有更新
  if (updateLane == NoLane) {
    return
  }
  if (updateLane === SyncLane) {  //同步优先级, 用微任务调度

    if (__DEV__) {
      console.log("在微任务中调度,优先级:", updateLane)
    }
    //每次更新都会[]中插入一个update
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane))
    scheduleMicroTask(flushSyncCallbacks)

  } else {  //其他优先级, 用宏任务调度

  }

}


//将lane记录在fiberRootNode上
function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}


function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = node.return;
  while (parent != null) {
    node = parent;
    parent = node.return;
  }
  if (node.tag == HostRoot) {
    return node.stateNode;
  }
  return null;
}


//render阶段的入口
function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {

  const nextLane = getHighestPriorityLane(root.pendingLanes)

  if (nextLane !== SyncLane) { //两种情况: 1. 其他比SyncLane低的优先级 2. NoLane优先级
    ensureRootIsScheduled(root); //重新调度
    return
  }


  //初始化, 并保存当前本次更新的lane
  prepareFreshStack(root, lane);

  do {
    try {
      workLoop();
      break;
    } catch (e) {
      if (__DEV__) {
        console.error(e, "workLoop 发生错误");
      }

      workInProgress = null;
    }
  } while (true);
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  root.finishedLane = lane
  wipRootRenderLane = NoLane; //本次更新结束后赋值为NoLane

  commitRoot(root); // 执行Commit阶段的入口
}
//lane调度的时候, render阶段和commit阶段只执行一次

//优先执行子节点的useEffect

function commitRoot(root: FiberRootNode) {  //root为根节点
  const finishedWork = root.finishedWork; //获取finishedWork
  if (finishedWork === null) {  //如果finishedWork为null时, 该commit阶段是不存在的
    return
  }
  if (__DEV__) {
    console.warn("commit阶段开始", finishedWork)
  }
  const lane = root.finishedLane;
  if (lane === NoLane && __DEV__) {
    console.error("commit阶段finishedLane不应该是NoLane")
  }

  //执行重置操作, 已经不需要了, finishedWork已经存储在变量中
  root.finishedWork = null;
  root.finishedLane = NoLane;
  markRootFinished(root, lane);  //从根节点中移除lane

  //存在函数组件需要执行useEffect回调
  if ((finishedWork.flags & PassiveMask) != NoFlags || (finishedWork.subtreeFlags & PassiveMask) !== NoFlags) {

    if (!rootDoesHasPassiveEffects) {
      rootDoesHasPassiveEffects = true;
      //调度副作用
      scheduleCallback(NormalPriority, () => {
        //执行副作用
        flushPassiveEffects(root.pendingPassiveEffects)
        return;
      })
    }
  }


  //判断是否存在3个子阶段需要执行的操作
  //需要判断两项: root本身下的flags和subtreeFlags

  const subtreeHasEffect = (finishedWork.subtreeFlags & MutationMark) != NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMark) != NoFlags;

  //也就是说我们的root它本身的flags以及root的subtreeFlag中是否包含MutationMark中指定的flags
  //如果包含的话就代表我们当前存在mutation阶段需要执行的操作
  //如果我们要执行layout阶段或者beforeMutation阶段的一些子操作的话, 我们只需要执行对应beforeMutation的mark以及layout的mark,并且把它们加进去就可以

  if (subtreeHasEffect || rootHasEffect) {

    //beforeMutation阶段

    //mutation阶段 主要就是Placement对应数组环境的操作
    //fiber树的切换发生在mutation阶段以及layout阶段之间, 也就是mutation阶段完成layout的阶段开始之前
    //root.current指向的是currentFiber树  finishedWork是本次更新生成的workInProgressFiber树
    //赋值的话就是可以实现fiber树的切换

    //执行commitMutationEffects
    commitMutationEffects(finishedWork, root);
    root.current = finishedWork

    //layout阶段

  } else {
    root.current = finishedWork
  }

  //重置rootDoesHasPassiveEffects
  rootDoesHasPassiveEffects = false;
  ensureRootIsScheduled(root)
}

//副作用函数
function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffect) {

  //先遍历执行destory函数
  pendingPassiveEffects.unmount.forEach((effect) => {
    commitHookEffectsListUnmount(Passive, effect)
  })
  pendingPassiveEffects.unmount = [];

  //触发上一次更新的destroy
  pendingPassiveEffects.update.forEach((effect) => {
    commitHookEffectsListDestory(Passive | HookHasEffect, effect); //要同时标记Passive和HookHasEffect标记
  })

  //触发本次更新的create
  pendingPassiveEffects.update.forEach((effect) => {
    commitHookEffectsListCreate(Passive | HookHasEffect, effect); //要同时标记Passive和HookHasEffect标记
  })
  pendingPassiveEffects.update = [];
  flushSyncCallbacks()
}

//遍历efffect链表
function commitHookEffectsList(flags: Flags, lastEffect: Effect, callback: (effect: Effect) => void) {
  let effect = lastEffect.next as Effect; //获取第一个effect

  do {
    if ((effect.tag & flags) === flags) {
      callback(effect)
    }
    effect = effect.next as Effect;
  } while (effect != lastEffect.next)
}

//destory函数中执行链表
function commitHookEffectsListDestory(flags: Flags, lastEffect: Effect) {
  commitHookEffectsList(flags, lastEffect, (effect) => {
    const destory = effect.destory; //获取destory函数

    if (typeof destory === "function") {
      destory()
    }
  })
}
//destory函数中执行链表
function commitHookEffectsListCreate(flags: Flags, lastEffect: Effect) {
  commitHookEffectsList(flags, lastEffect, (effect) => {
    const create = effect.create; //获取destory函数

    if (typeof create === "function") {
      effect.destory = create(); //将create函数返回值赋值给destory
    }
  })
}

function commitHookEffectsListUnmount(flags: Flags, lastEffect: Effect) {
  commitHookEffectsList(flags, lastEffect, (effect) => {
    const destory = effect.destory; //获取destory函数

    if (typeof destory === "function") {
      destory()
    }
    //执行完destory函数后, 组件已经被卸载, 需要移除后续的hook
    effect.tag &= ~HookHasEffect
  })
}






function workLoop() {
  while (workInProgress != null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber, wipRootRenderLane);
  fiber.memoizedProps = fiber.pendingProps;

  if (next === null) {
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;

  do {
    completeWork(node);

    const siblings = fiber.sibling;
    if (siblings !== null) {
      workInProgress = siblings;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}
