import {writeLog} from "helpers/DataHelper";
import {LOG_TYPES} from "configs/constants";

const isLogEnabled = true

export default class Log {
  static i(tag: any, message?: any, obj?: any, obj2?: any){
    if(!isLogEnabled) {
      return
    }
    if (obj != null){
      if (obj2 != null){
        console.log(`Logi -> ${tag}: `, message, obj, obj2)
      } else {
        console.log(`Logi -> ${tag}: `, message, obj)
      }
    } else {
      console.log(`Logi -> ${tag}: `, message)
    }

    if(typeof tag === "string" && (tag.includes(LOG_TYPES.strophe) || tag.includes(LOG_TYPES.addon))) {
      writeLog(`${tag} ->`, {
        msg: message,
        obj,
        obj2
      });
    }
  }

  static e(tag: any, message?: any, obj?: any){
    if (!isLogEnabled) {
      return
    }
    console.error(`Loge -> ${tag}: `, message, obj)
  }
}

