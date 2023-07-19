"use strict";

import parseXML from "../custom-libs/ObjTree";
import dump from "../custom-libs/JklDumper";
import {XML_EMPTY_TAG} from "xmpp/XMLConstants";

export default (xml) => {
    const tree: any = parseXML(xml.outerHTML.replace('xml:lang="en"', ""));
    const jsonStr: string = dump(tree);
    let jsonObj: any;

    try {
        if (jsonStr.includes('"call"') || (jsonStr.includes('"x"') && !jsonStr.includes('"search": "x"')) || jsonStr.includes('"IMAGE"') || jsonStr.includes('"VIDEO"') || jsonStr.includes('msgType')) {
            jsonObj = oldXmlToJson(xml);
        } else {
            jsonObj = JSON.parse(jsonStr);
        }
    } catch (e) {
        console.dir(e);
        console.dir(xml);
    }

    if (jsonObj.message && jsonObj.message.properties && jsonObj.message.properties.property) {
        if (Array.isArray(jsonObj.message.properties.property)) {
            for (const property of jsonObj.message.properties.property) {
                jsonObj.message[property.name["#text"] || property.name] = property.value["#text"] ? property.value["#text"] : property.value || "";
            }
        } else {
            jsonObj.message[jsonObj.message.properties.property.name["#text"] || jsonObj.message.properties.property.name] = jsonObj.message.properties.property.value["#text"] || "";
        }
        delete jsonObj.message.properties;
    }
    return jsonObj.message || jsonObj.iq || jsonObj.presence || jsonObj.ping || jsonObj;
}

const oldXmlToJson: any = (xml, tab = " ") => {
    const X: any = {
        toObj: xmlIn => {
            let o: any = {};
            if (xmlIn.nodeType === 1) {

                if (xmlIn.attributes.length) {
                    for (let i: number = 0; i < xmlIn.attributes.length; i++) {
                        o[xmlIn.attributes[i].nodeName] = (xmlIn.attributes[i].nodeValue || "").toString();
                    }
                }

                if (xmlIn.firstChild) {
                    let hasElementChild: boolean = false;
                    let cdataChild: number = 0;
                    let textChild: number = 0;

                    for (let n: any = xmlIn.firstChild; n; n = n.nextSibling) {
                        if (n.nodeType === 1) {
                            hasElementChild = true;
                        } else if (n.nodeType === 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                            textChild++;
                        } else if (n.nodeType === 4) {
                            cdataChild++;
                        }
                    }

                    if (hasElementChild) {
                        if (textChild < 2 && cdataChild < 2) {
                            X.removeWhite(xmlIn);
                            for (let n: any = xmlIn.firstChild; n; n = n.nextSibling) {
                                if (n.nodeType === 3) {
                                    o["#text"] = X.escape(n.nodeValue);
                                } else if (n.nodeType === 4) {
                                    o["#cdata"] = X.escape(n.nodeValue);
                                } else if (o[n.nodeName]) {
                                    if (o[n.nodeName] instanceof Array) {
                                        o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                                    } else {
                                        o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                                    }
                                } else {
                                    o[n.nodeName] = X.toObj(n);
                                }
                            }
                        } else {
                            if (!xmlIn.attributes.length) {
                                o = X.escape(X.innerXml(xmlIn));
                            } else {
                                o["#text"] = X.escape(X.innerXml(xmlIn));
                            }
                        }
                    } else if (textChild) {
                        if (!xmlIn.attributes.length) {
                            o = X.escape(X.innerXml(xmlIn));
                        } else {
                            o["#text"] = X.escape(X.innerXml(xmlIn));
                        }
                    } else if (cdataChild) {
                        if (cdataChild > 1) {
                            o = X.escape(X.innerXml(xmlIn));
                        } else {
                            for (let n: any = xmlIn.firstChild; n; n = n.nextSibling) {
                                o["#cdata"] = X.escape(n.nodeValue);
                            }
                        }
                    }
                }
                if (!xmlIn.attributes.length && !xmlIn.firstChild) {
                    o = XML_EMPTY_TAG;
                }
            } else if (xmlIn.nodeType === 9) {
                o = X.toObj(xmlIn.documentElement);
            } else {
                alert("unhandled node type: " + xmlIn.nodeType);
            }
            return o;
        },
        toJson: (o, name, ind) => {
            let json: any = name ? ("\"" + name + "\"") : "";
            if (o instanceof Array) {
                for (let i: number = 0; i < o.length; i++) {
                    o[i] = X.toJson(o[i], "", ind + "\t");
                }
                json += (name ? ':[' : "[") + (o.length > 1 ? ("\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind) : o.join("")) + "]";
            } else if (o == null) {
                json += (name && ":") + "null";
            } else if (typeof(o) === "object") {
                const arr: Array<any> = [];
                for (const m in o) {
                    if (o.hasOwnProperty(m)) {
                        arr[arr.length] = X.toJson(o[m], m, ind + "\t");
                    }
                }
                json += (name ? ":{" : "{") + (arr.length > 1 ? ("\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind) : arr.join("")) + "}";
            } else if (typeof(o) === "string") {
                json += (name && ":") + "\"" + o.toString() + "\"";
            } else {
                json += (name && ":") + o.toString();
            }
            return json;
        },
        innerXml: node => {
            let s: string = "";
            if ("innerHTML" in node) {
                s = node.innerHTML;
            } else {
                const asXml: any = n => {
                    let str: string = "";
                    if (n.nodeType === 1) {
                        str += "<" + n.nodeName;
                        for (let i: number = 0; i < n.attributes.length; i++) {
                            str += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue || "").toString() + "\"";
                        }
                        if (n.firstChild) {
                            str += ">";
                            for (let c: any = n.firstChild; c; c = c.nextSibling) {
                                str += asXml(c);
                            }
                            str += "</" + n.nodeName + ">";
                        } else {
                            str += "/>";
                        }
                    } else if (n.nodeType === 3) {
                        str += n.nodeValue;
                    } else if (n.nodeType === 4) {
                        str += "<![CDATA[" + n.nodeValue + "]]>";
                    }
                    return str;
                };
                for (let c: any = node.firstChild; c; c = c.nextSibling) {
                    s += asXml(c);
                }
            }
            return s;
        },
        escape: txt => {
            return txt.replace(/[\\]/g, "\\\\")
                .replace(/["]/g, "\\\"")
                .replace(/[\n]/g, "\\n")
                .replace(/[\r]/g, "\\r");
        },
        removeWhite: e => {
            e.normalize();
            for (let n: any = e.firstChild; n;) {
                if (n.nodeType === 3) {
                    if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                        const nxt: any = n.nextSibling;
                        e.removeChild(n);
                        n = nxt;
                    } else {
                        n = n.nextSibling;
                    }
                } else if (n.nodeType === 1) {
                    X.removeWhite(n);
                    n = n.nextSibling;
                } else {
                    n = n.nextSibling;
                }
            }
            return e;
        }
    };
    if (xml.nodeType === 9) {
        xml = xml.documentElement;
    }
    const json: any = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
    return JSON.parse("{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/t\n/g, "")) + "\n}");
};
