import { scheduleMicroTask } from "hostConfig";
import { beginWork } from "./beginWork";
import { commitMutationEffects } from "./commitWork";
import { completeWork } from "./completeWork";
import { FiberNode, FiberRootNode, createWorkInProgress, markRootFinished } from "./fiber";
import { MutationMark, NoFlags } from "./fiberFlags";
import { Lane, NoLane, SyncLane, getHighestPriorityLane, mergeLanes } from "./fiberLanes";
import { flushSyncCallbacks, scheduleSyncCallback } from "./syncTaskQueue";
import { HostRoot } from "./workTags";

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;  //保存本次更新的lane

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
    commitMutationEffects(finishedWork);
    root.current = finishedWork

    //layout阶段

  } else {
    root.current = finishedWork
  }

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
