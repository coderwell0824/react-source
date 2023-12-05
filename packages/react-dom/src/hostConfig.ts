
//Element类型无法识别, 需要解决
export type Container = Element;
export type Instance = Element;

export const createInstance = (type: string, props: any): Instance => {

  //TODO 处理props
  console.log(props)
  const element = document.createElement(type);
  return element;
}
export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
}

export const appendInitalChild = (parent: Instance | Container, child: Instance) => {

  parent.appendChild(child);
}

//
export const appendChildToContainer = appendInitalChild


