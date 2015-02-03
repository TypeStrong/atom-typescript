// To make it easier for me to serilize json on stdin
export class BufferedBySeperatorHandler {
    static seperator = "||atomts||";
    totalTrailing: string[] = [];
    incompleteEnding = '';
    constructor(public callback: (data: any) => any) { }

    handle(data: any) {
        var m = data.toString(); // Fix this and use encoding.
        if (!m && this.totalTrailing.length) { // process totalTrailing
            m = this.totalTrailing.shift();

            // If length == 1. We should account for our previous incompleteEnding
            if (this.totalTrailing.length == 1 && this.incompleteEnding) {
                m = m + this.incompleteEnding;
                this.incompleteEnding = '';

                // Adding an incompleteEnding might have made it *two* messages
                // so keep processing
                this.handle(m);
                return;
            }
        }
        else {
            m = m.toString();
            var parts = m.split(BufferedBySeperatorHandler.seperator);
            if (parts.length == 2 && parts[1] == '') { // Great the perfect match!
            }
            else if (parts.length > 1) { // oh oh ... an unperfect match and we have more than 1 items
                // -1 because the last part is just because we always end on trailer
                // Potential TODO: If the last part isn't "seperator" then we have an incomplete part

                var more = parts.slice(1, parts.length - 1);
                this.totalTrailing = this.totalTrailing.concat(more);

                // If the last part is not "" we have an imperfect ending
                this.incompleteEnding = parts[parts.length - 1];
            }
            m = parts[0];
        }

        // TADA
        this.callback(m);

        // Process remaining
        if (this.totalTrailing.length) {
            this.handle('');
        }
    }
}

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
