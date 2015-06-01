import {Transformer} from "../transformer";
import {add} from "../transformerRegistry";

/** Does no transform whatsoever. This is to test the infrastructure */
export class NullTransformer implements Transformer {
    name = "null";

    transform(code: string) {
        return { code };
    }
}
add(new NullTransformer());