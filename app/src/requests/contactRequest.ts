import conf from "configs/configurations";
import axios from "services/request";
import {converter, types} from "helpers/DataHelper";

export const getContactsData: any = () => {
    return axios.get(
        conf.http + conf.api.v3.contact.get,
        )
};

export const deleteContact: any = (data) => {
    return axios.post(
      conf.http + conf.api.v3.contact.delete,
      data
    );
};

export const saveContact: any = (data) => {
    return axios.post(
      conf.http + conf.api.v3.contact.save,
      data
    );
};
