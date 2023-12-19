import { Container } from "hostConfig"
import { FiberNode, FiberRootNode } from "./fiber"
import { HostRoot } from "./workTags"
import { UpdateQueue, createUpdate, createUpdateQueue, enqueueUpdate } from "./updateQueue";
import { ReactElementType } from "shared/ReactTypes";
import { scheduleUpdateFiber } from "./workLoop";

//不依赖数组环境
export function createContainer(container: Container) {

  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);

  hostRootFiber.updateQueue = createUpdateQueue()
  return root;
}

export function updateContainer(element: ReactElementType | null, root: FiberRootNode) {

  console.log(element, root, "dddd")
  const hostRootFiber = root.current;

  const update = createUpdate<ReactElementType | null>(element);

  enqueueUpdate(hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>, update)

  scheduleUpdateFiber(hostRootFiber)
  return element;
}