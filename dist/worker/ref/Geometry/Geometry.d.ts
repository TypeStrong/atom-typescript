import VertexBufferAttribInfo from "./VertexBufferAttribInfo";
import AABB from "grimoirejs-math/ref/AABB";
import Program from "../Resource/Program";
import IndexBufferInfo from "./IndexBufferInfo";
import Buffer from "../Resource/Buffer";
export default class Geometry {
    verticies: {
        [key: string]: Buffer;
    };
    attribInfo: {
        [key: string]: VertexBufferAttribInfo;
    };
    indicies: {
        [key: string]: IndexBufferInfo;
    };
    aabb: AABB;
    private _gl;
    constructor(verticies: {
        [key: string]: Buffer;
    }, attribInfo: {
        [key: string]: VertexBufferAttribInfo;
    }, indicies: {
        [key: string]: IndexBufferInfo;
    }, aabb: AABB);
    draw(indexName: string, attribNames: string[], program: Program, count?: number, offset?: number): void;
    private _validateGLContext();
}
