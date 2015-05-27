import {Transformer} from "./transformer";
import {NullTransformer} from "./implementations/nullTransformer";


export var allTransformers: Transformer[] = [
    new NullTransformer(),
];
