export var orphanExitCode = 100;

// Parent makes queries<T>
// Child responds<T>
export interface Message<T> {
    message: string;
    id: string;
    data?: T;
    error?: {
        method: string;
        message: string;
        stack: string;
        details: any;
    };
}
