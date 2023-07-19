import conf from "configs/configurations";
import axios from "services/request";

export const getDeepLink: any = () => {
  return axios.get(
    conf.http + conf.api.v3.conversation.getConversationDeepLink,
  )
};
