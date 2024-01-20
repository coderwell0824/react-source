import { Dispatcher, resolveDispatcher } from "./src/curentDispatcher";
import curentDispatcher from "./src/curentDispatcher";
import { jsxDEV, jsx, isValidElement as isValidElementFn } from "./src/jsx";

export const useState: Dispatcher["useState"] = (initialState) => {

	const dispatcher = resolveDispatcher();  //解析当前函数组件的dispatcher
	return dispatcher.useState(initialState);  //调用dispatcher下的useState
}

export const useEffect: Dispatcher["useEffect"] = (create: any, deps: any) => {

	const dispatcher = resolveDispatcher();  //解析当前函数组件的dispatcher
	return dispatcher.useEffect(create, deps);  //调用dispatcher下的useState
}

//内部数据共享层对象
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIED = {
	curentDispatcher
}


export const version = "1.0.0";

//TODO: 根据环境区分使用jsx/jsxDev
export const createElement = jsx

export const isValidElement = isValidElementFn

// export default {
// 	version: "1.0.0",
// 	createElement: jsxDEV
// };
