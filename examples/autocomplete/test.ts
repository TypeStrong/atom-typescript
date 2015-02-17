var foo = 123;
class Bar {
    static bar: number;
    bar: number;
}
var bar = new Bar();

function bas(a: string): string;
function bas(a: number): string;
/** my super awesome comment */
function bas(a: number, b: number): number;
function bas(a: any, b?: number): any {
    return '';
}
var str = '';
var num = 123;
console.log(num);
