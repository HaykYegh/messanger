"use strict";

function escapeString(str: string): string {
    return str.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
}

export default function dump(data: any, offset: any = ""): any {
    const nextoff: string = offset + "  ";

    switch (typeof(data)) {
        case "string":
            return '"' + escapeString(data) + '"';
        case "number":
            return data;
        case "boolean":
            return !!data;
        case "undefined":
            return "null";
        case "object":
            if (data == null) {
                return "null";
            } else if (data.constructor === Array) {
                const array: Array<any> = [];
                for (let i: number = 0; i < data.length; i++) {
                    array[i] = dump(data[i], nextoff);
                }
                return "[\n" + nextoff + array.join(",\n" + nextoff) + "\n" + offset + "]";
            } else {
                const array: Array<any> = [];
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        const val: string = dump(data[key], nextoff);
                        const newKey: string = '"' + escapeString(key) + '"';
                        array[array.length] = newKey + ": " + val;
                    }
                }
                if (array.length === 1 && !array[0].match(/[\n\{\[]/)) {
                    return "{ " + array[0] + " }";
                }
                return "{\n" + nextoff + array.join(",\n" + nextoff) + "\n" + offset + "}";
            }
        default:
            return data;
    }
}
