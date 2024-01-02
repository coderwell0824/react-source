//判断是否支持Symbol
const supportSymbol = typeof Symbol === "function" && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for("react.element")
	: 0x6700;

export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for("react.fragment")
	: 0x67bb;


