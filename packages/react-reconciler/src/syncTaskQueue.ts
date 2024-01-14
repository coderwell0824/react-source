
let syncQueue: ((...args: any) => void)[] | null = null;  //同步调度队列, 存储的是调度的callback
let isFlushingSyncQueue: boolean = false; //是否正在冲洗同步任务队列

//调度同步任务的回调函数
export function scheduleSyncCallback(callback: (...args: any) => void) {
  if (syncQueue == null) {  //判断是否第一个callback并赋值
    syncQueue = [callback]
  } else {
    syncQueue.push(callback);
  }
}

//冲洗同步任务中的回调函数
export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue) {
    isFlushingSyncQueue = true
  }
  try {
    syncQueue?.forEach((callback) => callback())
  } catch (err) {
    console.error(err)
  } finally {
    isFlushingSyncQueue = false;
    syncQueue = null;
  }


}






