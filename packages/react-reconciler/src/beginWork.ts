//递归中的递阶段

import { ReactElementType } from "shared/ReactTypes";
import { FiberNode } from "./fiber";
import { UpdateQueue, processUpdateQueue } from "./updateQueue";
import { Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from "./workTags";
import { mountChildFibers, reconcileChildFibers } from "./childFibers";
import { renderWithHooks } from "./fiberHook";
import { Lane } from "./fiberLanes";

//比较和返回子fiberNode
export const beginWork = (wip: FiberNode, renderLane: Lane) => {

  //比较, 返回子fiberNode
  switch (wip.tag) {
    case HostRoot:
      updateHostRoot(wip, renderLane);
      return null;
    case HostComponent:
      updateHostComponent(wip);
      return null;
    case HostText:
      return null;

    case FunctionComponent:  //函数式组件
      return updateFunctionComponent(wip, renderLane);

    case Fragment:   //Fragment类型标签
      return updateFragment(wip);

    default:
      if (__DEV__) {
        console.warn("beginWork未实现的类型")
      }
      break;
  }
  return null;
};


//更新Fragment类型
function updateFragment(wip: FiberNode) {
  const nextChildren = wip.pendingProps;  //nextChildren为函数执行的结果
  reconcileChildren(wip, nextChildren)
  return wip.child
}

//更新函数式组件
function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
  const nextChildren = renderWithHooks(wip, renderLane);  //nextChildren为函数执行的结果
  reconcileChildren(wip, nextChildren)
  return wip.child
}


//更新根节点
function updateHostRoot(wip: FiberNode, renderLane: Lane) {
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>
  const pending = updateQueue.shared.pending;

  updateQueue.shared.pending = null;
  const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);
  wip.memoizedState = memoizedState;

  const nextChildren = wip.memoizedState;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

//更新xxx
function updateHostComponent(wip: FiberNode) {
  const nextProps = wip.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
  const current = wip.alternate;
  if (current != null) {
    wip.child = reconcileChildFibers(wip, current?.child, children!)
  } else {
    mountChildFibers(wip, null, children!)
  }
}


