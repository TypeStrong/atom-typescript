export interface Linter {
    deleteMessages()
    setMessages(messages: LinterMessage[])
    dispose()
}

export interface LinterConfig {
    name: string
}

export interface LinterMessage {
    type: "Error" | "Warning" | "Info",
    text?: string,
    html?: string,
    filePath?: string,
    range?: TextBuffer.IRange,
    //  trace?: Array<Trace> // We don't care about this so I have this commented out
}

export interface LinterRegistry {
    register(config: LinterConfig): Linter
}
