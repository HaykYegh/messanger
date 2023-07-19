"use strict";


export const sanitizeByPrefix = (prefix: string, contactInfo: any): any => {
    if (contactInfo) {
        const filteredContact: any = {};
        Object.keys(contactInfo).forEach(key => {
            if(contactInfo[key]) {
                filteredContact[key] = contactInfo[key].replace(prefix, '');
            }
        });
        return filteredContact;
    }
};
