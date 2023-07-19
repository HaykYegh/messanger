"use strict";

export default (() => {
    const forceArray: any = {};

    function addNode(hash: any, key: any, cnts: any, val: any): void {
        if (forceArray[key]) {
            if (cnts === 1) {
                hash[key] = [];
            }
            hash[key][hash[key].length] = val;
        } else if (cnts === 1) {
            hash[key] = val;
        } else if (cnts === 2) {
            hash[key] = [hash[key], val];
        } else {
            hash[key][hash[key].length] = val;
        }
    }

    function array_to_xml(name: string, array: Array<any>): string {
        const out: Array<any> = [];
        for (let i: number = 0; i < array.length; i++) {
            const val: any = array[i];
            if (typeof(val) === "undefined" || val == null) {
                out[out.length] = "<" + name + " />";
            } else if (typeof(val) === "object" && val.constructor === Array) {
                out[out.length] = array_to_xml(name, val);
            } else if (typeof(val) === "object") {
                out[out.length] = hash_to_xml(name, val);
            } else {
                out[out.length] = scalar_to_xml(name, val);
            }
        }
        return out.join("");
    }

    function scalar_to_xml(name: string, text: string): string {
        if (name === "#text") {
            return xml_escape(text);
        } else {
            return "<" + name + ">" + xml_escape(text) + "</" + name + ">\n";
        }
    }

    function hash_to_xml(name: string, tree: any): any {
        const elem: Array<any> = [];
        const attr: Array<any> = [];
        for (const key in tree) {
            if (!tree.hasOwnProperty(key)) {
                continue;
            }

            const val: any = tree[key];

            if (key.charAt(0) !== "") {
                if (typeof(val) === "undefined" || val == null) {
                    elem[elem.length] = "<" + key + " />";
                } else if (typeof(val) === "object" && val.constructor === Array) {
                    elem[elem.length] = array_to_xml(key, val);
                } else if (typeof(val) === "object") {
                    elem[elem.length] = hash_to_xml(key, val);
                } else {
                    elem[elem.length] = scalar_to_xml(key, val);
                }
            } else {
                attr[attr.length] = " " + (key.substring(1)) + '="' + (xml_escape(val)) + '"';
            }
        }

        const jattr: string = attr.join("");
        let jelem: string = elem.join("");

        if (elem.length > 0) {
            if (jelem.match(/\n/)) {
                jelem = "<" + name + jattr + ">\n" + jelem + "</" + name + ">\n";
            } else {
                jelem = "<" + name + jattr + ">" + jelem + "</" + name + ">\n";
            }
        } else if (typeof(name) !== "undefined" && name !== null) {
            jelem = "<" + name + jattr + " />\n";
        }

        return jelem;
    }

    function xml_escape(text: string): string {
        return (text + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function parseElement(elem: any): any {
        if (elem.nodeType === 7) {
            return;
        }

        if (elem.nodeType === 3 || elem.nodeType === 4) {
            const bool: boolean = elem.nodeValue.match(/[^\x00-\x20]/);
            if (bool === null) {
                return;
            }
            return elem.nodeValue;
        }

        let retval: any;
        const cnt: any = {};

        if (elem.attributes && elem.attributes.length) {
            retval = {};
            for (let i: number = 0; i < elem.attributes.length; i++) {
                const key: string = elem.attributes[i].nodeName;

                if (typeof(key) !== "string") {
                    continue;
                }

                const val: string | null = elem.attributes[i].nodeValue;

                if (!val) {
                    continue;
                }

                if (typeof(cnt[key]) === "undefined") {
                    cnt[key] = 0;
                }

                cnt[key]++;

                addNode(retval, key, cnt[key], val);
            }
        }

        if (elem.childNodes && elem.childNodes.length) {
            let textonly: boolean = true;

            if (retval) {
                textonly = false;
            }

            for (let i: number = 0; i < elem.childNodes.length && textonly; i++) {
                const ntype: number = elem.childNodes[i].nodeType;
                if (ntype === 3 || ntype === 4) {
                    continue;
                }
                textonly = false;
            }

            if (textonly) {
                if (!retval) {
                    retval = "";
                }

                for (let i: number = 0; i < elem.childNodes.length; i++) {
                    retval += elem.childNodes[i].nodeValue;
                }
            } else {
                if (!retval) {
                    retval = {};
                }

                for (let i: number = 0; i < elem.childNodes.length; i++) {
                    const key: string = elem.childNodes[i].nodeName;

                    if (typeof(key) !== "string") {
                        continue;
                    }

                    const val: any = parseElement(elem.childNodes[i]);

                    if (!val) {
                        continue;
                    }

                    if (typeof(cnt[key]) === "undefined") {
                        cnt[key] = 0;
                    }

                    cnt[key]++;

                    addNode(retval, key, cnt[key], val);
                }
            }
        }
        return retval;
    }

    function parseDOM(root: any): any {
        if (!root) {
            return;
        }

        if (forceArray) {
            for (let i: number = 0; i < forceArray.length; i++) {
                forceArray[forceArray[i]] = 1;
            }
        }

        let json: any = parseElement(root);

        if (forceArray[root.nodeName]) {
            json = [json];
        }

        if (root.nodeType !== 11) {
            const tmp: any = {};
            tmp[root.nodeName] = json;
            json = tmp;
        }

        return json;
    }

    function parseXML(xml: any): any {
        let root: any;
        let xmldom: any;

        if (DOMParser) {
            xmldom = new DOMParser();
            const dom: Document = xmldom.parseFromString(xml, "application/xml");
            if (!dom) {
                return;
            }
            root = dom.documentElement;
        } else if ((window as any).ActiveXObject) {
            xmldom = new (window as any).ActiveXObject('Microsoft.XMLDOM');
            xmldom.async = false;
            xmldom.loadXML(xml);
            root = xmldom.documentElement;
        }

        if (!root) {
            return;
        }

        return parseDOM(root);
    }

    /*function parseHTTP(url: string, options: any, callback: any): any {
        const myopt: any = {...options};
        if (!myopt.method) {
            if (typeof(myopt.postBody) === "undefined" && typeof(myopt.postbody) === "undefined" && typeof(myopt.parameters) === "undefined") {
                myopt.method = "get";
            } else {
                myopt.method = "post";
            }
        }
        if (callback) {
            myopt.asynchronous = true;
            myopt.onComplete = trans => {
                let tree: any;
                if (trans && trans.responseXML && trans.responseXML.documentElement) {
                    tree = this.parseDOM(trans.responseXML.documentElement);
                }
                callback(tree, trans);
                if (myopt.onComplete) {
                    myopt.onComplete(trans);
                }
            };
        } else {
            myopt.asynchronous = false;
        }

        const trans: any;
        if (typeof(HTTP) !== "undefined" && HTTP.Request) {
            myopt.uri = url;
            const req: any = new HTTP.Request(myopt);
            if (req) {
                trans = req.transport;
            }
        } else if (typeof(Ajax) !== "undefined" && Ajax.Request) {
            const req: any = new Ajax.Request(url, myopt);
            if (req) {
                trans = req.transport;
            }
        }

        if (callback) {
            return trans;
        }

        if (trans && trans.responseXML && trans.responseXML.documentElement) {
            return this.parseDOM(trans.responseXML.documentElement);
        }
    }*/

    return parseXML
})()
