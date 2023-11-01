import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { FiberNode, FiberRootNode, createWorkInProgress } from "./fiber";
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
      console.error(e, "workLoop 发生错误");
      workInProgress = null;
    }
  } while (true);
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
