import { Container, appendInitalChild, createInstance, createTextInstance } from "hostConfig";
import { FiberNode } from "./fiber";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./workTags";
import { NoFlags } from "./fiberFlags";

//递归阶段中的归阶段
export const completeWork = (wip: FiberNode) => {

  const newProps = wip.pendingProps;
  const current = wip.alternate;

  switch (wip.tag) {
    case HostComponent:
      if (current !== null && wip.stateNode) {  //update
      } else {
        //构建离屏的DOM树步骤: 
        //1. 构建DOM树  
        const instance = createInstance(wip.type, newProps);
        appendAllChildren(instance, wip);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostText:
      if (current !== null && wip.stateNode) {  //update
      } else {
        //构建离屏的DOM树步骤: 
        //1. 构建DOM树  
        const instance = createTextInstance(newProps.content);
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostRoot:
      bubbleProperties(wip);
      return null;

    case FunctionComponent:
      bubbleProperties(wip);
      return null;

    default:
      if (__DEV__) {
        console.error("未实现的completeWork情况")
      }
      break;
  }
};


function appendAllChildren(parent: Container, wip: FiberNode) {
  let node = wip.child;
  while (node !== null) {
    if (node?.tag == HostComponent || node?.tag == HostText) {
      appendInitalChild(parent, node.stateNode)
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === wip) {
      return
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === wip) {
        return;
      }
      node = node?.return
    }

    node.sibling.return = node.return
    node = node.sibling;
  }
}


function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;
  let child = wip.child;


  while (child !== null) {

    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = wip;
    child = child.sibling;
  }

  wip.subtreeFlags |= subtreeFlags;


}
