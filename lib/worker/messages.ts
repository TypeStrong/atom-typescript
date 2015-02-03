// Parent makes queries
// Child responds

export interface Message<T> {
    message: string;
    id: string;
    data: T;
}

export var echo = 'echo';
export interface EchoQuery {
    echo: any;
}
export interface EchoResponse {
    echo: any;
}
