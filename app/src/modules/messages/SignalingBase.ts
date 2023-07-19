import conf from "configs/configurations";

export class SignalingBase {

  getUserNumberWithoutPrefix(number: string) : string {
    if (number == null || number == ""){
      return ""
    }

    let split = number.split("@")

    if (split == null || split.length == 0){
      return number
    }


    return split[0].replace(conf.app.prefix, "")
  }
}
