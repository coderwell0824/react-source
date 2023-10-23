import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
	Type,
	Key,
	Ref,
	Props,
	ReactElementType,
	ElementType
} from "shared/ReactTypes";

//定义ReactElement结构
const ReactElement = function (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		key,
		ref,
		props,
		type
	};

	return element;
};

export const jsx = function (type: ElementType, config: any, ...rest: any) {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop == "key") {
			if (val !== undefined) {
				key = "" + val;
			}
			continue;
		}

		if (prop == "ref") {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}

		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}

		const restLength = rest.length;

		if (restLength) {
			if (restLength == 1) {
				props.children = rest[0];
			} else {
				props.children = rest;
			}
		}
	}
	return ReactElement(type, key, ref, props);
};

export const jsxDEV = function (type: ElementType, config: any) {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop == "key") {
			if (val !== undefined) {
				key = "" + val;
			}
			continue;
		}

		if (prop == "ref") {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}

		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	return ReactElement(type, key, ref, props);
};
