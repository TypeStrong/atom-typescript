"use strict";
function createElement(name, props, ...children) {
    if (typeof name !== "string") {
        throw new Error("String tag name expected");
    }
    const element = document.createElement(name);
    if (props) {
        for (let attr in props) {
            if (attr === "ref") {
                if (typeof props[attr] !== "function") {
                    throw new Error("Ref attribute value should be a function");
                }
                var ref = props[attr];
                continue;
            }
            else if (attr === "key") {
                continue;
            }
            const value = props[attr];
            if (attr.startsWith("on") && attr[2] && attr[2] === attr[2].toUpperCase()) {
                attr = attr.toLowerCase();
            }
            else if (attr === "style") {
                if (typeof value === "object" && value) {
                    const style = element.style;
                    for (const prop in value) {
                        if (typeof value[prop] === "number") {
                            style[prop] = value[prop] + "px";
                        }
                        else {
                            style[prop] = value[prop];
                        }
                    }
                }
                break;
            }
            element[attr] = value;
        }
    }
    for (const child of children) {
        if (typeof child === "string" || typeof child === "number") {
            element.appendChild(document.createTextNode(child.toString()));
        }
        else if (child instanceof HTMLElement) {
            element.appendChild(child);
        }
        else if (child === null || child === undefined) {
        }
        else {
            throw new Error("Unknown child type: " + child);
        }
    }
    if (ref) {
        ref(element);
    }
    return element;
}
exports.createElement = createElement;
