import { FiberNode } from "react-reconciler/src/fiber";
import { HostComponent, HostText } from "react-reconciler/src/workTags";
import { updateFiberProps } from "./SyntheticEvent";
import { Props } from "shared/ReactTypes";
import { DOMElement } from "./SyntheticEvent"


//Element类型无法识别, 需要解决
export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props): Instance => {

  //TODO 处理props
  console.log(props)
  const element = document.createElement(type) as unknown;
  updateFiberProps(element as DOMElement, props);  //将事件回调保存在DOM上
  return element as DOMElement;
}
export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
}

export const appendInitalChild = (parent: Instance | Container, child: Element) => {

  parent.appendChild(child);
}

//
export const appendChildToContainer = (parent: Container, child: Element) => {
  parent.appendChild(child);
}

export function removeChild(child: Instance | TextInstance, container: Container) {
  container.removeChild(child);
}



//提交更新阶段
export function commitUpdate(fiber: FiberNode) {
  switch (fiber.tag) {

    case HostText:  //文本类型
      const text = fiber.memoizedProps.content; //获取更新后的text
      return commitTextUpdate(fiber.stateNode, text);

    // case HostComponent:
    //   updateFiberProps()

    default:
      if (__DEV__) {
        console.warn("未实现的Update类型", fiber)
      }
      break;
  }
}

//更新提交文本类型的节点
export function commitTextUpdate(textInstance: TextInstance, content: string) {
  textInstance.textContent = content;
}

//插入子节点到容器中
export function insertChildToContainer(child: Instance, container: Container, beforeElement: Instance) {
  container.insertBefore(child, beforeElement);
}



