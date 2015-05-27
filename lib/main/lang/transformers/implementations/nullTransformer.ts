import {Transformer} from "../transformer";

/** Does no transform whatsoever. This is to test the infrastructure */
export class NullTransformer implements Transformer {
    name = "null";

    transform(code: string) {
        return { code };
    }
}