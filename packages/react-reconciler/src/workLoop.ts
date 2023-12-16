import { beginWork } from "./beginWork";
import { commitMutationEffects } from "./commitWork";
import { completeWork } from "./completeWork";
import { FiberNode, FiberRootNode, createWorkInProgress } from "./fiber";
import { MutationMark, NoFlags } from "./fiberFlags";
import { HostRoot } from "./workTags";

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root);
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



function renderRoot(root: FiberRootNode) {
  //初始化
  prepareFreshStack(root);

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

  commitRoot(root); // 执行Commit阶段的入口
}

function commitRoot(root: FiberRootNode) {  //root为根节点


  const finishedWork = root.finishedWork; //获取finishedWork

  console.log(finishedWork, "commitRoot")

  if (finishedWork === null) {  //如果finishedWork为null时, 该commit阶段是不存在的
    return
  }

  if (__DEV__) {
    console.warn("commit阶段开始", finishedWork)
  }

  //执行重置操作, 已经不需要了, finishedWork已经存储在变量中
  // root.finishedWork = null;

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
  const next = beginWork(fiber);
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
