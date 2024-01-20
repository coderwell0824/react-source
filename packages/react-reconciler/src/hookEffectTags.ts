//通过tag来区分不同effect的实现

export const Passive = 0b0010; //useEffect的tag

export const HookHasEffect = 0b0001; //判断是否触发回调
