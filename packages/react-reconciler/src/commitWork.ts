import { Container, appendChildToContainer, commitUpdate, removeChild } from "hostConfig";
import { FiberNode, FiberRootNode } from "./fiber";
import { ChildDeletion, MutationMark, NoFlags, Placement, Update } from "./fiberFlags";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./workTags";

//因为我们的finishedWork指向的是我们的根节点, 我们就需要一个递归的过程, 从根节点依次往下找, 
//寻找的过程中判断的依据就是subtreeFlags

let nextEffect: FiberNode | null = null;  //指向下一个需要执行的effects, 是一个FiberNode或者Node

export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork
  while (nextEffect != null) {
    //向下遍历
    const child: FiberNode | null = nextEffect.child;

    //判断是否存在mutation阶段需要执行的工作
    //如果child不等于null, 这种情况下我们应该继续向子节点遍历
    if ((nextEffect.subtreeFlags & MutationMark) != NoFlags && child != null) {

      //因为subtreeFlags中包含了MutationMark中的flags, 那就代表了它的子节点有可能存在对应Mutation阶段的操作
      nextEffect = child;
    } else {
      //已经找到底了或者我们找到的节点不包含subtreeFlags了
      //但是往下遍历到最深的那个节点, 不一定是叶子节点, 可能是遇到的第一个不存在subtreeFlags的节点
      //执行向上遍历

      up: while (nextEffect != null) {
        //执行commitMutationEffectsOnFiber
        commitMutationEffectsOnFiber(nextEffect)

        const sibling: FiberNode | null = nextEffect.sibling;

        //如果sibling不等于null, 继续遍历sibling
        if (sibling != null) {
          nextEffect = sibling;
          break up;
        }

        //sibling等于null的话
        nextEffect = nextEffect.return  //也就是它的父节点
      }
    }
  }
}

//finishedWork是真正存在flags的节点
const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {

  const flags = finishedWork.flags;

  //判断是否存在Placement对应的操作
  if ((flags & Placement) !== NoFlags) {

    //执行commitPlacement
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement //执行完后将Placement从它的flags中移除
  }

  //判断是否存在update流程
  if ((flags & Update) !== NoFlags) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update //执行完后将Update从它的flags中移除
  }

  //判断是否存在childDeletion流程
  if ((flags & ChildDeletion) !== NoFlags) {
    const deletions = finishedWork.deletions; //获取父节点上的deletion数组
    if (deletions != null) {
      deletions.forEach((childToDelete) => {
        commitDeletion(childToDelete)
      })
    }
    finishedWork.flags &= ~ChildDeletion //执行完后将ChildDeletion从它的flags中移除
  }
}

//删除节点的提交阶段
function commitDeletion(childToDelete: FiberNode) {

  let rootHostNode: FiberNode | null = null;  //定义需要删除的子树的根节点

  //递归子树
  commitNestedComponent(childToDelete, (unMountFiber) => {
    switch (unMountFiber.tag) {
      case HostComponent:
        if (rootHostNode == null) {
          rootHostNode = unMountFiber;
        }
        //TODO 解绑ref
        return

      case HostText:
        if (rootHostNode == null) {
          rootHostNode = unMountFiber;
        }
        return
      case FunctionComponent:
        //TODO useEffect unmount流程
        return
      default:
        if (__DEV__) {
          console.warn("未处理的unmount类型", unMountFiber)
        }
        break;
    }
  })

  //移除rootHostNode的DOM的操作
  if (rootHostNode !== null) {
    const hostParent = getHostParent(childToDelete);  //获取父节点
    removeChild((rootHostNode as FiberNode).stateNode, hostParent!)
  }

  //重置操作
  childToDelete.return = null;
  childToDelete.child = null;
}

//root为递归当前的子节点, onCommitUnmount为当前递归的回调函数
function commitNestedComponent(root: FiberNode, onCommitUnmount: (fiber: FiberNode) => void) {
  //深度优先遍历的过程
  let node = root;

  while (true) {
    onCommitUnmount(node);

    if (node.child != null) {  //node的子节点不为null继续向下遍历
      node.child.return = node;
      node = node.child;
      continue
    }

    if (node == root) {  //终止条件
      return
    }

    while (node.sibling == null) {
      if (node.return == null || node.return === root) {
        return
      }

      //向上归的过程
      node = node.return;
    }

    node.sibling.return = node.return; //保持链接
    node = node.sibling;
  }
}



const commitPlacement = (finishedWork: FiberNode) => {
  //首先我们需要知道它的父级节点, 对应浏览器来说就是父级的DOM节点, 我们还需要知道finishedWork如何找到对应的DOM节点
  //这样能将这个DOM节点插入对应的父节点下

  console.log(finishedWork, "finishedWork")

  if (__DEV__) {
    console.warn("执行Placement操作", finishedWork)
  }
  //第一步: 获取父级的这个原生数组环境对应的节点
  const hostParent = getHostParent(finishedWork);

  //第二步: 找到finishedWork对应的DOM节点, 并将这个DOM插入到parent中
  if (hostParent != null) {
    appendPlacementNodeIntoContainer(finishedWork, hostParent)
  }
}

function getHostParent(fiber: FiberNode) {
  let parent = fiber.return;

  //如果parent存在
  while (parent) {
    const parentTag = parent.tag;

    //哪几种情况下parentTag对应的是数组环境下的父级节点呢? 一是hostComponent, 二是HostRoot

    if (parentTag === HostComponent) {
      //因为对应一个HostComponent类型的fiber节点来说, 它对应的数组环境节点是保存在fiber上的stateNode中
      return parent.stateNode as Container;
    }

    if (parentTag === HostRoot) {
      //对于hostRoot来说, container对应的是原生数组环境的节点
      return (parent.stateNode as FiberRootNode).container
    }

    parent = parent.return;

    if (__DEV__) {
      console.warn("未找到host parent")
    }
  }
}

/* 
  其实就是一个递归向下的过程, 知道我们找到第一层, 他的类型是HostComponent或者HostText的fiber节点
  将这一层节点以及它的兄弟节点都执行对应的操作
*/

function appendPlacementNodeIntoContainer(finishedWork: FiberNode, hostParent: Container) {

  //因为传进来的finishedWork不一定是host类型的fiber节点, 所以需要向下遍历通过传进来的这个fiber找到它对应的数组环境

  //判断tag是否等于HostComponent和HostText
  if (finishedWork.tag == HostComponent || finishedWork.tag == HostText) {
    appendChildToContainer(hostParent, finishedWork.stateNode);
    return
  }

  const child = finishedWork.child;
  if (child != null) {
    appendPlacementNodeIntoContainer(child, hostParent)

    let sibling = child.sibling;
    while (sibling != null) {
      appendPlacementNodeIntoContainer(sibling, hostParent);

      sibling = sibling.sibling;


    }


  }


}


