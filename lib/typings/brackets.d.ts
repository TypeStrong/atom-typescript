//   Copyright 2013-2014 François de Campredon
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.


///<reference path="./codemirror.d.ts" />



//--------------------------------------------------------------------------
//
//  Brackets declaration files
//
//--------------------------------------------------------------------------




declare module brackets {


    //--------------------------------------------------------------------------
    //
    //  FileSystem
    //
    //--------------------------------------------------------------------------

    /**
     * FileSystem is a model object representing a complete file system. This object creates
     * and manages File and Directory instances, dispatches events when the file system changes,
     * and provides methods for showing 'open' and 'save' dialogs.
     *
     * The FileSystem must be initialized very early during application startup.
     *
     * There are three ways to get File or Directory instances:
     *    * Use FileSystem.resolve() to convert a path to a File/Directory object. This will only
     *      succeed if the file/directory already exists.
     *    * Use FileSystem.getFileForPath()/FileSystem.getDirectoryForPath() if you know the
     *      file/directory already exists, or if you want to create a new entry.
     *    * Use Directory.getContents() to return all entries for the specified Directory.
     *
     * FileSystem dispatches the following events:
     *    change - Sent whenever there is a change in the file system. The handler
     *          is passed one argument -- entry. This argument can be...
     *          *  a File - the contents of the file have changed, and should be reloaded.
     *          *  a Directory - an immediate child of the directory has been added, removed,
     *             or renamed/moved. Not triggered for "grandchildren".
     *          *  null - a 'wholesale' change happened, and you should assume everything may
     *             have changed.
     *          For changes made externally, there may be a significant delay before a "change" event
     *          is dispatched.
     *    rename - Sent whenever a File or Directory is renamed. All affected File and Directory
     *          objects have been updated to reflect the new path by the time this event is dispatched.
     *          This event should be used to trigger any UI updates that may need to occur when a path
     *          has changed.
     *
     * FileSystem may perform caching. But it guarantees:
     *    * File contents & metadata - reads are guaranteed to be up to date (cached data is not used
     *      without first veryifying it is up to date).
     *    * Directory structure / file listing - reads may return cached data immediately, which may not
     *      reflect external changes made recently. (However, changes made via FileSystem itself are always
     *      reflected immediately, as soon as the change operation's callback signals success).
     *
     * The FileSystem doesn't directly read or write contents--this work is done by a low-level
     * implementation object. This allows client code to use the FileSystem API without having to
     * worry about the underlying storage, which could be a local filesystem or a remote server.
     */
    interface FileSystem {
        // should not expose thoses method one
        //init(impl, callback)
        //close(callback)
        //shouldShow

        /**
         * Return a File object for the specified path.This file may not yet exist on disk.
         *
         * @param path Absolute path of file.
         */
        getFileForPath(path: string): File;

        /**
         * Return a Directory object for the specified path.This directory may not yet exist on disk.
         *
         * @param path Absolute path of directory.
         */
        getDirectoryForPath(path: string): Directory;

         /**
         * Resolve a path.
         *
         * @param path The path to resolve
         * @param callback Callback resolved  with a FileSystemError string or with the entry for the provided path.
         */
        resolve(path: string, callback: (err: string, entry: FileSystemEntry, stat: FileSystemStats) => any): void;


         /**
         * Show an "Open" dialog and return the file(s)/directories selected by the user.
         *
         * @param allowMultipleSelection Allows selecting more than one file at a time
         * @param chooseDirectories Allows directories to be opened
         * @param title The title of the dialog
         * @param initialPath The folder opened inside the window initially. If initialPath
         *                          is not set, or it doesn't exist, the window would show the last
         *                          browsed folder depending on the OS preferences
         * @param fileTypes List of extensions that are allowed to be opened. A null value
         *                          allows any extension to be selected.
         * @param callback Callback resolved with a FileSystemError
         *                          string or the selected file(s)/directories. If the user cancels the
         *                          open dialog, the error will be falsy and the file/directory array will
         *                          be empty.
         */
        showOpenDialog(allowMultipleSelection: boolean, chooseDirectories: boolean, title: string, initialPath: string,
            fileTypes: string[], callback: (err: string, files: string[]) => any): void;

        /**
         * Show a "Save" dialog and return the path of the file to save.
         *
         * @param title The title of the dialog.
         * @param initialPath The folder opened inside the window initially. If initialPath
         *                          is not set, or it doesn't exist, the window would show the last
         *                          browsed folder depending on the OS preferences.
         * @param proposedNewFilename Provide a new file name for the user. This could be based on
         *                          on the current file name plus an additional suffix
         * @param callback Callback that is resolved with a FileSystemError
         *                          string or the name of the file to save. If the user cancels the save,
         *                          the error will be falsy and the name will be empty.
         */
        showSaveDialog(title: string, initialPath: string, proposedNewFilename: string, callback: (err: string, file: string) => any): void;

        /**
         * Start watching a filesystem root entry.
         *
         * @param entry The root entry to watch. If entry is a directory,
         *      all subdirectories that aren't explicitly filtered will also be watched.
         * @param filter A function to determine whether
         *      a particular name should be watched or ignored. Paths that are ignored are also
         *      filtered from Directory.getContents() results within this subtree.
         * @param callback A function that is called when the watch has completed.
         *      If the watch fails, the function will have a non-null FileSystemError string parametr.
         */
        watch(entry: FileSystemEntry, filter: (file: string) => boolean, callback?: (file: string) => void): void;

        /**
         * Stop watching a filesystem root entry.
         *
         * @param {FileSystemEntry} entry - The root entry to stop watching. The unwatch will
         *      if the entry is not currently being watched.
         * @param {function(?string)=} callback - A function that is called when the unwatch has
         *      completed. If the unwatch fails, the function will have a non-null FileSystemError
         *      string parameter.
         */
        unwatch(entry: FileSystemEntry, callback?: (file: string) => void): void;

        /**
         * return true if the path is absolute
         *
         * @param path
         */
        isAbsolutePath(path: string): boolean;


        /**
         * Add an event listener for a FileSystem event.
         *
         * @param  event The name of the event
         * @param  handler The handler for the event
         */
        on(event: string, handler: (...args: any[]) => any): void;

        /**
         * Remove an event listener for a FileSystem event.
         *
         * @param event The name of the event
         * @param handler The handler for the event
         */
        off(event: string, handler: (...args: any[]) => any): void;
    }


    /**
     * This is an abstract representation of a FileSystem entry, and the base class for the File and Directory classes.
     * FileSystemEntry objects are never created directly by client code. Use FileSystem.getFileForPath(),
     * FileSystem.getDirectoryForPath(), or Directory.getContents() to create the entry.
     */
    interface FileSystemEntry {
        fullPath: string;
        name: string;
        parentPath: string;
        id: string;
        isFile: boolean;
        isDirectory: boolean;

        /**
         * Check to see if the entry exists on disk. Note that there will NOT be an
         * error returned if the file does not exist on the disk; in that case the
         * error parameter will be null and the boolean will be false. The error
         * parameter will only be truthy when an unexpected error was encountered
         * during the test, in which case the state of the entry should be considered
         * unknown.
         *
         * @param callback Callback with a FileSystemError
         *      string or a boolean indicating whether or not the file exists.
         */
        exists(callback: (err: string, exist: boolean) => any): void;


        /**
         * Returns the stats for the entry.
         *
         * @param callback Callback with a FileSystemError string or FileSystemStats object.
         */
        stat(callback: (err: string, stat: FileSystemStats) => any): void;

         /**
         * Rename this entry.
         *
         * @param {string} newFullPath New path & name for this entry.
         * @param {function (?string)=} callback Callback with a single FileSystemError string parameter.
         */
        rename(newFullPath: string, callback?: (err: string) => any): void;


        /**
         * Unlink (delete) this entry. For Directories, this will delete the directory
         * and all of its contents.
         *
         * @param callback Callback with a single FileSystemError string parameter.
         */
         unlink(callback?: (err: string) => any): void;


         /**
         * Move this entry to the trash. If the underlying file system doesn't support move
         * to trash, the item is permanently deleted.
         *
         * @param callback Callback with a single FileSystemError string parameter.
         */

        moveToTrash(callback?: (err: string) => any): void;

         /**
         * Visit this entry and its descendents with the supplied visitor function.
         *
         * @paramvisitor - A visitor function, which is applied to descendent FileSystemEntry objects. If the function returns false for
         *      a particular Directory entry, that directory's descendents will not be visited.
         * @param {{failFast: boolean=, maxDepth: number=, maxEntries: number=}=} options
         * @param {function(?string)=} callback Callback with single FileSystemError string parameter.
         */
        visit(visitor: (entry: FileSystemEntry) => boolean, options: {failFast?: boolean; maxDepth?: number; maxEntries?: number},
            callbak: (err: string) => any): void;
    }

    /**
     * This class represents a directory on disk (this could be a local disk or cloud storage). This is a subclass of FileSystemEntry.
     */
    interface Directory extends FileSystemEntry {
        /**
         * Read the contents of a Directory.
         *
         * @param callback Callback that is passed an error code or the stat-able contents
         *          of the directory along with the stats for these entries and a
         *          fullPath-to-FileSystemError string map of unstat-able entries
         *          and their stat errors. If there are no stat errors then the last
         *          parameter shall remain undefined.
         */
        getContents(callback: (err: string, files: FileSystemEntry[],
            stats: FileSystemStats, errors: { [path: string]: string; }) => any): void;


        /**
         * Create a directory
         *
         * @param callback Callback resolved with a FileSystemError string or the stat object for the created directory.
         */
        create(callback:  (err: string, stat: FileSystemStats) => any): void;
    }

    /**
     * This class represents a file on disk (this could be a local disk or cloud storage). This is a subclass of FileSystemEntry.
     */
    interface File extends FileSystemEntry {
         /**
         * Read a file.
         *
         * @param options Currently unused.
         * @param callback Callback that is passed the FileSystemError string or the file's contents and its stats.
         */
        read(options: {}, callback: (err: string, data: string, stat: FileSystemStats) => any): void;


        /**
         * Write a file.
         *
         * @param data Data to write.
         * @param options Currently unused.
         * @param callback Callback that is passed the FileSystemError string or the file's new stats.
         */
        write(data: string, options?: {}, callback?: (err: string, stat: FileSystemStats) => any ): void;



    }

    interface FileSystemStats {
        isFile: boolean;
        isDirectory: boolean;
        mtime: Date;
        size: number;
    }

    //--------------------------------------------------------------------------
    //
    //  Project
    //
    //--------------------------------------------------------------------------




    /**
     * ProjectManager is the model for the set of currently open project. It is responsible for
     * creating and updating the project tree when projects are opened and when changes occur to
     * the file tree.
     *
     * This module dispatches these events:
     *    - beforeProjectClose -- before _projectRoot changes
     *    - beforeAppClose     -- before Brackets quits entirely
     *    - projectOpen        -- after _projectRoot changes and the tree is re-rendered
     *    - projectRefresh     -- when project tree is re-rendered for a reason other than
     *                            a project being opened (e.g. from the Refresh command)
     *
     * These are jQuery events, so to listen for them you do something like this:
     *    $(ProjectManager).on("eventname", handler);
     */
    interface ProjectManager {
         /**
         * Returns the root folder of the currently loaded project, or null if no project is open (during
         * startup, or running outside of app shell).
         */
        getProjectRoot(): Directory;

        /**
         * Returns the encoded Base URL of the currently loaded project, or empty string if no project
         * is open (during startup, or running outside of app shell).
         */
        getBaseUrl(): string;

        /**
         * Sets the encoded Base URL of the currently loaded project.
         * @param {String}
         */
        setBaseUrl(): string;

        /**
         * Returns true if absPath lies within the project, false otherwise.
         * Does not support paths containing ".."
         */
        isWithinProject(absPath: string): boolean;

        /**
         * If absPath lies within the project, returns a project-relative path. Else returns absPath
         * unmodified.
         * Does not support paths containing ".."
         * @param  absPath
         */
        makeProjectRelativeIfPossible(absPath: string): string;

         /**
         * Returns false for files and directories that are not commonly useful to display.
         *
         * @param entry File or directory to filter
         */
        shouldShow(entry: FileSystemEntry): boolean;

         /**
         * Returns true if fileName's extension doesn't belong to binary (e.g. archived)
         * @param fileName
         */
        isBinaryFile(fileName: string): boolean;

        /**
         * Open a new project. Currently, Brackets must always have a project open, so
         * this method handles both closing the current project and opening a new project.
         * return {$.Promise} A promise object that will be resolved when the
         * project is loaded and tree is rendered, or rejected if the project path
         * fails to load.
         *
         * @param path Optional absolute path to the root folder of the project.
         *  If path is undefined or null, displays a dialog where the user can choose a
         *  folder to load. If the user cancels the dialog, nothing more happens.

         */
        openProject(path?: string): JQueryPromise<any>;

         /**
         * Returns the File or Directory corresponding to the item selected in the sidebar panel, whether in
         * the file tree OR in the working set; or null if no item is selected anywhere in the sidebar.
         * May NOT be identical to the current Document - a folder may be selected in the sidebar, or the sidebar may not
         * have the current document visible in the tree & working set.
         */
        getSelectedItem(): FileSystemEntry;

         /**
         * Returns an Array of all files for this project, optionally including
         * files in the working set that are *not* under the project root. Files filtered
         * out by shouldShow() OR isBinaryFile() are excluded.
         *
         * @param filter Optional function to filter
         *          the file list (does not filter directory traversal). API matches Array.filter().
         * @param includeWorkingSet If true, include files in the working set
         *          that are not under the project root (*except* for untitled documents).
         *
         * @return {$.Promise} Promise that is resolved with an Array of File objects.
         */
        getAllFiles(filter?: (file: File) => boolean, includeWorkingSet?: boolean): JQueryPromise<File[]>;

        /*
         TODO
        getInitialProjectPath;
        isWelcomeProjectPath;
        updateWelcomeProjectPath;
        createNewItem;
        renameItemInline;
        deleteItem;
        forceFinishRename;
        showInTree;
        refreshFileTree;

        getLanguageFilter;

        */
    }

    //--------------------------------------------------------------------------
    //
    //  Document
    //
    //--------------------------------------------------------------------------

    /**
     * DocumentManager maintains a list of currently 'open' Documents. It also owns the list of files in
     * the working set, and the notion of which Document is currently shown in the main editor UI area.
     *
     * Document is the model for a file's contents; it dispatches events whenever those contents change.
     * To transiently inspect a file's content, simply get a Document and call getText() on it. However,
     * to be notified of Document changes or to modify a Document, you MUST call addRef() to ensure the
     * Document instance 'stays alive' and is shared by all other who read/modify that file. ('Open'
     * Documents are all Documents that are 'kept alive', i.e. have ref count > 0).
     *
     * To get a Document, call getDocumentForPath(); never new up a Document yourself.
     *
     * Secretly, a Document may use an Editor instance to act as the model for its internal state. (This
     * is unavoidable because CodeMirror does not separate its model from its UI). Documents are not
     * modifiable until they have a backing 'master Editor'. Creation of the backing Editor is owned by
     * EditorManager. A Document only gets a backing Editor if it becomes the currentDocument, or if edits
     * occur in any Editor (inline or full-sized) bound to the Document; there is currently no other way
     * to ensure a Document is modifiable.
     *
     * A non-modifiable Document may still dispatch change notifications, if the Document was changed
     * externally on disk.
     *
     * Aside from the text content, Document tracks a few pieces of metadata - notably, whether there are
     * any unsaved changes.
     *
     * This module dispatches several events:
     *
     *    - dirtyFlagChange -- When any Document's isDirty flag changes. The 2nd arg to the listener is the
     *      Document whose flag changed.
     *    - documentSaved -- When a Document's changes have been saved. The 2nd arg to the listener is the
     *      Document that has been saved.
     *    - documentRefreshed -- When a Document's contents have been reloaded from disk. The 2nd arg to the
     *      listener is the Document that has been refreshed.
     *
     *    - currentDocumentChange -- When the value of getCurrentDocument() changes.
     *
     *    To listen for working set changes, you must listen to *all* of these events:
     *    - workingSetAdd -- When a file is added to the working set (see getWorkingSet()). The 2nd arg
     *      to the listener is the added File, and the 3rd arg is the index it was inserted at.
     *    - workingSetAddList -- When multiple files are added to the working set (e.g. project open, multiple file open).
     *      The 2nd arg to the listener is the array of added File objects.
     *    - workingSetRemove -- When a file is removed from the working set (see getWorkingSet()). The
     *      2nd arg to the listener is the removed File.
     *    - workingSetRemoveList -- When multiple files are removed from the working set (e.g. project close).
     *      The 2nd arg to the listener is the array of removed File objects.
     *    - workingSetSort -- When the workingSet array is reordered without additions or removals.
     *      Listener receives no arguments.
     *
     *    - workingSetDisableAutoSorting -- Dispatched in addition to workingSetSort when the reorder was caused
     *      by manual dragging and dropping. Listener receives no arguments.
     *
     *    - fileNameChange -- When the name of a file or folder has changed. The 2nd arg is the old name.
     *      The 3rd arg is the new name.
     *    - pathDeleted -- When a file or folder has been deleted. The 2nd arg is the path that was deleted.
     *
     * These are jQuery events, so to listen for them you do something like this:
     *    $(DocumentManager).on("eventname", handler);
     *
     * Document objects themselves also dispatch some events - see Document docs for details.
     */
    export interface DocumentManager {
         /**
         * Returns the Document that is currently open in the editor UI. May be null.
         * When this changes, DocumentManager dispatches a "currentDocumentChange" event. The current
         * document always has a backing Editor (Document._masterEditor != null) and is thus modifiable.
         */
        getCurrentDocument(): Document;

        /** Changes currentDocument to null, causing no full Editor to be shown in the UI */
        _clearCurrentDocument(): void;

        /**
         * Gets an existing open Document for the given file, or creates a new one if the Document is
         * not currently open ('open' means referenced by the UI somewhere). Always use this method to
         * get Documents; do not call the Document constructor directly. This method is safe to call
         * in parallel.
         *
         * If you are going to hang onto the Document for more than just the duration of a command - e.g.
         * if you are going to display its contents in a piece of UI - then you must addRef() the Document
         * and listen for changes on it. (Note: opening the Document in an Editor automatically manages
         * refs and listeners for that Editor UI).
         *
         * @param fullPath
         * @return {$.Promise} A promise object that will be resolved with the Document, or rejected
         *      with a FileSystemError if the file is not yet open and can't be read from disk.
         */
        getDocumentForPath(fullPath: string): JQueryPromise<Document>;

        /**
         * Returns the existing open Document for the given file, or null if the file is not open ('open'
         * means referenced by the UI somewhere). If you will hang onto the Document, you must addRef()
         * it; see {@link getDocumentForPath()} for details.
         * @param fullPath
         */
        getOpenDocumentForPath(fullPath: string): Document;

         /**
         * Gets the text of a Document (including any unsaved changes), or would-be Document if the
         * file is not actually open. More efficient than getDocumentForPath(). Use when you're reading
         * document(s) but don't need to hang onto a Document object.
         *
         * If the file is open this is equivalent to calling getOpenDocumentForPath().getText(). If the
         * file is NOT open, this is like calling getDocumentForPath()...getText() but more efficient.
         * Differs from plain FileUtils.readAsText() in two ways: (a) line endings are still normalized
         * as in Document.getText(); (b) unsaved changes are returned if there are any.
         *
         * @param file
         */
        getDocumentText(file: File): JQueryPromise<string>;

        /**
         * Creates an untitled document. The associated File has a fullPath that
         * looks like /some-random-string/Untitled-counter.fileExt.
         *
         * @param counter - used in the name of the new Document's File
         * @param fileExt - file extension of the new Document's File
         * @return {Document} - a new untitled Document
         */
        createUntitledDocument(counter: number, fileExt: string): Document;


        /**
         * Returns a list of items in the working set in UI list order. May be 0-length, but never null.
         *
         * When a file is added this list, DocumentManager dispatches a "workingSetAdd" event.
         * When a file is removed from list, DocumentManager dispatches a "workingSetRemove" event.
         * To listen for ALL changes to this list, you must listen for both events.
         *
         * Which items belong in the working set is managed entirely by DocumentManager. Callers cannot
         * (yet) change this collection on their own.
         *
         */
        getWorkingSet(): File[];

         /**
         * Returns the index of the file matching fullPath in the working set.
         * Returns -1 if not found.
         * @param fullPath
         * @param list Pass this arg to search a different array of files. Internal
         *          use only.
         * @returns {number} index
         */
        findInWorkingSet(fullPath: string, list?: File[]): number;
        /*TODO
        findInWorkingSetAddedOrder()
        getAllOpenDocuments()
        setCurrentDocument()
        addToWorkingSet()
        addListToWorkingSet()
        removeFromWorkingSet()
        removeListFromWorkingSet()
        getNextPrevFile()
        swapWorkingSetIndexes()
        sortWorkingSet()
        beginDocumentNavigation()
        finalizeDocumentNavigation()
        closeFullEditor()
        closeAll()
        notifyFileDeleted()
        notifyPathNameChanged()
        notifyPathDeleted()*/
    }


    /**
     * Model for the contents of a single file and its current modification state.
     * See DocumentManager documentation for important usage notes.
     *
     * Document dispatches these events:
     *
     * change -- When the text of the editor changes (including due to undo/redo).
     *
     *        Passes ({Document}, {ChangeList}), where ChangeList is a linked list (NOT an array)
     *        of change record objects. Each change record looks like:
     *
     *            { from: start of change, expressed as {line: <line number>, ch: <character offset>},
     *              to: end of change, expressed as {line: <line number>, ch: <chracter offset>},
     *              text: array of lines of text to replace existing text,
     *              next: next change record in the linked list, or undefined if this is the last record }
     *
     *        The line and ch offsets are both 0-based.
     *
     *        The ch offset in "from" is inclusive, but the ch offset in "to" is exclusive. For example,
     *        an insertion of new content (without replacing existing content) is expressed by a range
     *        where from and to are the same.
     *
     *        If "from" and "to" are undefined, then this is a replacement of the entire text content.
     *
     *        IMPORTANT: If you listen for the "change" event, you MUST also addRef() the document
     *        (and releaseRef() it whenever you stop listening). You should also listen to the "deleted"
     *        event.
     *
     *        (FUTURE: this is a modified version of the raw CodeMirror change event format; may want to make
     *        it an ordinary array)
     *
     * deleted -- When the file for this document has been deleted. All views onto the document should
     *      be closed. The document will no longer be editable or dispatch "change" events.
     *
     */
    interface Document {
        /**
         * The File for this document. Need not lie within the project.
         * If Document is untitled, this is an InMemoryFile object.
         */
        file: File;

        /**
         * The Language for this document. Will be resolved by file extension in the constructor
         * @type {!Language}
         */
        //TODO language: Language;

        /**
         * Whether this document has unsaved changes or not.
         * When this changes on any Document, DocumentManager dispatches a "dirtyFlagChange" event.
         */
        isDirty: boolean;

        /**
         * Returns the document's current contents; may not be saved to disk yet. Whenever this
         * value changes, the Document dispatches a "change" event.
         *
         * @param useOriginalLineEndings If true, line endings in the result depend on the
         *      Document's line endings setting (based on OS & the original text loaded from disk).
         *      If false, line endings are always \n (like all the other Document text getter methods).
         */
        getText(useOriginalLineEndings?: boolean): string;

        /**
         * Adds, replaces, or removes text. If a range is given, the text at that range is replaced with the
         * given new text; if text == "", then the entire range is effectively deleted. If 'end' is omitted,
         * then the new text is inserted at that point and all existing text is preserved. Line endings will
         * be rewritten to match the document's current line-ending style.
         *
         * IMPORTANT NOTE: Because of #1688, do not use this in cases where you might be
         * operating on a linked document (like the main document for an inline editor)
         * during an outer CodeMirror operation (like a key event that's handled by the
         * editor itself). A common case of this is code hints in inline editors. In
         * such cases, use `editor._codeMirror.replaceRange()` instead. This should be
         * fixed when we migrate to use CodeMirror's native document-linking functionality.
         *
         * @param text  Text to insert or replace the range with
         * @param start  Start of range, inclusive (if 'to' specified) or insertion point (if not)
         * @param end  End of range, exclusive; optional
         * @param origin  Optional string used to batch consecutive edits for undo.
         *     If origin starts with "+", then consecutive edits with the same origin will be batched for undo if
         *     they are close enough together in time.
         *     If origin starts with "*", then all consecutive edit with the same origin will be batched for
         *     undo.
         *     Edits with origins starting with other characters will not be batched.
         *     (Note that this is a higher level of batching than batchOperation(), which already batches all
         *     edits within it for undo. Origin batching works across operations.)
         */
        replaceRange(text: string, start: CodeMirror.Position, end?: CodeMirror.Position, origin?: string): void;

        /**
         * Returns the text of the given line (excluding any line ending characters)
         * @param index Zero-based line number
         */
        getLine(index: number): string;

        /**
         * Sets the contents of the document. Treated as an edit. Line endings will be rewritten to
         * match the document's current line-ending style.
         * @param text The text to replace the contents of the document with.
         */
        setText(text: string): void;

        //TODO imcomplete
    }

    //--------------------------------------------------------------------------
    //
    //  Editor
    //
    //--------------------------------------------------------------------------

    /**
     * Editor is a 1-to-1 wrapper for a CodeMirror editor instance. It layers on Brackets-specific
     * functionality and provides APIs that cleanly pass through the bits of CodeMirror that the rest
     * of our codebase may want to interact with. An Editor is always backed by a Document, and stays
     * in sync with its content; because Editor keeps the Document alive, it's important to always
     * destroy() an Editor that's going away so it can release its Document ref.
     *
     * For now, there's a distinction between the "master" Editor for a Document - which secretly acts
     * as the Document's internal model of the text state - and the multitude of "slave" secondary Editors
     * which, via Document, sync their changes to and from that master.
     *
     * For now, direct access to the underlying CodeMirror object is still possible via _codeMirror --
     * but this is considered deprecated and may go away.
     *
     * The Editor object dispatches the following events:
     *    - keyEvent -- When any key event happens in the editor (whether it changes the text or not).
     *          Event handlers are passed ({Editor}, {KeyboardEvent}). The 2nd arg is the raw DOM event.
     *          Note: most listeners will only want to respond when event.type === "keypress".
     *    - cursorActivity -- When the user moves the cursor or changes the selection, or an edit occurs.
     *          Note: do not listen to this in order to be generally informed of edits--listen to the
     *          "change" event on Document instead.
     *    - scroll -- When the editor is scrolled, either by user action or programmatically.
     *    - lostContent -- When the backing Document changes in such a way that this Editor is no longer
     *          able to display accurate text. This occurs if the Document's file is deleted, or in certain
     *          Document->editor syncing edge cases that we do not yet support (the latter cause will
     *          eventually go away).
     *    - optionChange -- Triggered when an option for the editor is changed. The 2nd arg to the listener
     *          is a string containing the editor option that is changing. The 3rd arg, which can be any
     *          data type, is the new value for the editor option.
     *
     * The Editor also dispatches "change" events internally, but you should listen for those on
     * Documents, not Editors.
     *
     * These are jQuery events, so to listen for them you do something like this:
     *    $(editorInstance).on("eventname", handler);
     */
    interface Editor {
        _codeMirror: CodeMirror.Editor;
        document: Document;
        getCursorPos(): CodeMirror.Position;
        getModeForSelection(): string;
        getSelection(boolean: boolean): {
            start: CodeMirror.Position;
            end: CodeMirror.Position
        };
        setCursorPos(line: number, ch: number, center: boolean, expandTabs: boolean): void ;
    }


    interface EditorManager {
        registerInlineEditProvider(provider: InlineEditProvider, priority?: number): void;
        registerInlineDocsProvider(provider: InlineDocsProvider, priority?: number): void;
        registerJumpToDefProvider(provider: JumpDoDefProvider): void;
        getFocusedEditor(): Editor;
        /**
         * Returns the current active editor (full-sized OR inline editor). This editor may not
         * have focus at the moment, but it is visible and was the last editor that was given
         * focus. Returns null if no editors are active.
         * @see getFocusedEditor()
         * @returns {?Editor}
         */
        getActiveEditor(): Editor;
        getCurrentFullEditor(): Editor;
    }

    //--------------------------------------------------------------------------
    //
    //  Editor
    //
    //--------------------------------------------------------------------------

    /**
     * PreferencesManager
     *
     */
    interface PreferencesManager extends Preferences {
        /**
         * Creates an extension-specific preferences manager using the prefix given.
         * A `.` character will be appended to the prefix. So, a preference named `foo`
         * with a prefix of `myExtension` will be stored as `myExtension.foo` in the
         * preferences files.
         *
         * @param prefix Prefix to be applied
         */
        getExtensionPrefs(prefix: string): Preferences;


        /**
         * Get the full path to the user-level preferences file.
         *
         * @return Path to the preferences file
         */
        getUserPrefFile(): string;

        /**
         * Context to look up preferences for the currently edited file.
         * This is undefined because this is the default behavior of PreferencesSystem.get.
         */
        CURRENT_FILE: any;
        /**
         * Context to look up preferences in the current project.
         */
        CURRENT_PROJECT: any;
    }

    interface Preferences {
        /**
         * Defines a new (prefixed) preference.
         *
         * @param id unprefixed identifier of the preference. Generally a dotted name.
         * @param type Data type for the preference (generally, string, boolean, number)
         * @param initial Default value for the preference
         * @param options Additional options for the pref. Can include name and description
         *                          that will ultimately be used in UI.
         * @return {Object} The preference object.
         */
        definePreference(id: string, type: string, value: any, options?: { name?: string; description: string; }): any;


        /**
         * Get the prefixed preference object
         *
         * @param {string} id ID of the pref to retrieve.
         */
        getPreference(id: string): any;

        /**
         * Gets the prefixed preference
         *
         * @param id Name of the preference for which the value should be retrieved
         * @param context Optional context object to change the preference lookup
         */
        get(id: string, context?: any): any;

        /**
         * Gets the location in which the value of a prefixed preference has been set.
         *
         * @param id Name of the preference for which the value should be retrieved
         * @param context Optional context object to change the preference lookup
         * @return Object describing where the preferences came from
         */
        getPreferenceLocation(id: string, context?: any): {scope: string; layer?: string; layerID?: any};

        /**
         * Sets the prefixed preference
         *
         * @param id Identifier of the preference to set
         * @param value New value for the preference
         * @param options Specific location in which to set the value or the context to use when setting the value
         * @return true if a value was set
         */
        set(id: string, value: any, options?: {location: any; context?: any; }): boolean;


        /**
         * Sets up a listener for events for this PrefixedPreferencesSystem. Only prefixed events
         * will notify. Optionally, you can set up a listener for a
         * specific preference.
         *
         * @param event Name of the event to listen for
         * @param preferenceID Name of a specific preference
         * @param handler Handler for the event
         */
        on(event: string, preferenceId: string, handler: (...rest: any[]) => void): void;
        /**
         * Sets up a listener for events for this PrefixedPreferencesSystem. Only prefixed events
         * will notify. Optionally, you can set up a listener for a
         * specific preference.
         *
         * @param event Name of the event to listen for
         * @param handler Handler for the event
         */
        on(event: string, handler: (...rest: any[]) => void): void;


        /**
         * Turns off the event handlers for a given event, optionally for a specific preference
         * or a specific handler function.
         *
         * @param event Name of the event for which to turn off listening
         * @param preferenceID Name of a specific preference
         * @param handler Specific handler which should stop being notified
         */
        off(event: string, preferenceId: string, handler: (...rest: any[]) => void): void;
        /**
         * Turns off the event handlers for a given event, optionally for a specific preference
         * or a specific handler function.
         *
         * @param event Name of the event to listen for
         * @param handler Specific handler which should stop being notified
         */
        off(event: string, handler: (...rest: any[]) => void): void;


        /**
         * Saves the preferences. If a save is already in progress, a Promise is returned for
         * that save operation.
         *
         * @return  a promise resolved when the preferences are done saving.
         */
        save(): JQueryPromise<void>;
    }



    //--------------------------------------------------------------------------
    //
    //  PanelManager
    //
    //--------------------------------------------------------------------------

    /**
     * Represents a panel below the editor area (a child of ".content").
     */
    interface Panel {
        isVisible(): boolean;
        show(): void;
        hide(): void;
        setVisible(visible: boolean): void;
        $panel: JQuery
    }

    /**
     * Manages layout of panels surrounding the editor area, and size of the editor area (but not its contents).
     *
     * Updates panel sizes when the window is resized. Maintains the max resizing limits for panels, based on
     * currently available window size.
     *
     * Events:
     *    - editorAreaResize -- When editor-holder's size changes for any reason (including panel show/hide
     *              panel resize, or the window resize).
     *              The 2nd arg is the new editor-holder height.
     *              The 3rd arg is a refreshHint flag for internal EditorManager use.
     */

    interface PanelManager {
         /**
         * Creates a new panel beneath the editor area and above the status bar footer. Panel is initially invisible.
         *
         * @param id  Unique id for this panel. Use package-style naming, e.g. "myextension.feature.panelname"
         * @param $panel  DOM content to use as the panel. Need not be in the document yet.
         * @param minSize  Minimum height of panel in px.
         */
        createBottomPanel(id: string, $panel: JQuery, minSize: number): Panel;
    }

    //--------------------------------------------------------------------------
    //
    //  Command
    //
    //--------------------------------------------------------------------------
    interface CommandManager {
        execute(id: string, args: any): JQueryPromise<any>;
        register(name: string, id: string, callback: () => void): void;
    }


    //--------------------------------------------------------------------------
    //
    //  CodeHint
    //
    //--------------------------------------------------------------------------


    interface CodeHintManager {
        registerHintProvider(hintProvider: CodeHintProvider, languageIds: string[], priority?: number): void;
    }
    interface HintResult {
        hints?: any [];
        match?: string;
        selectInitial?: boolean
    }

    interface CodeHintProvider {
        hasHints(editor: Editor, implicitChar: string): boolean;
        getHints(implicitChar: string): JQueryDeferred<HintResult>;
        insertHint(hint: any): void;
    }


    //--------------------------------------------------------------------------
    //
    //  Inspection
    //
    //--------------------------------------------------------------------------



    interface CodeInspection {
        register(languageId: string, provider: InspectionProvider): void;
        Type: { [index: string]: string}
    }


    interface LintingError {
        pos: CodeMirror.Position;
        endPos?: CodeMirror.Position;
        message: string;
        type?: string;
    }

    interface InspectionProvider {
        name: string;
        scanFile?(content: string, path: string): { errors: LintingError[];  aborted: boolean };
        scanFileAsync?(content: string, path: string): JQueryPromise<{ errors: LintingError[];  aborted: boolean }>;
    }


    //--------------------------------------------------------------------------
    //
    //  QuickEdit
    //
    //--------------------------------------------------------------------------

    interface InlineEditProvider {
        (hostEditor: Editor, pos: CodeMirror.Position): JQueryPromise<InlineWidget>
    }



    //--------------------------------------------------------------------------
    //
    //  QuickOpen
    //
    //--------------------------------------------------------------------------

    interface QuickOpen {
        /**
         * Creates and registers a new QuickOpenPlugin
         */
        addQuickOpenPlugin<S>(def: QuickOpenPluginDef<S>): void;
        highlightMatch(item: string): string;
    }


    interface QuickOpenPluginDef<S> {
        /**
         * plug-in name, **must be unique**
         */
        name: string;
        /**
         * language Ids array. Example: ["javascript", "css", "html"]. To allow any language, pass []. Required.
         */
        languageIds: string[];
        /**
         * called when quick open is complete. Plug-in should clear its internal state. Optional.
         */
        done?: () => void;
        /**
         * takes a query string and a StringMatcher (the use of which is optional but can speed up your searches)
         * and returns an array of strings that match the query. Required.
         */
        search: (request: string, stringMatcher: StringMatcher) => JQueryPromise<S[]>;
        /**
         * takes a query string and returns true if this plug-in wants to provide
         */
        match: (query: string) => boolean;
        /**
         * performs an action when a result has been highlighted (via arrow keys, mouseover, etc.).
         */
        itemFocus?: (result: S) => void;
        /**
         * performs an action when a result is chosen.
         */
        itemSelect: (result: S) => void;
        /**
         * takes a query string and an item string and returns
         * a <LI> item to insert into the displayed search results. Optional.
         */
        resultsFormatter?: (result: S) => string;

        /**
         * options to pass along to the StringMatcher (see StringMatch.StringMatcher for available options).
         */
        matcherOptions?: StringMatcherOptions;
        /**
         * if provided, the label to show before the query field. Optional.
         */
        label?: string;
    }

    interface StringMatcherOptions {
        preferPrefixMatches?: boolean;
        segmentedSearch?: boolean;
    }

    interface StringMatcher {
        match(target: string, query: string): {
            ranges: { text: string; matched: boolean; includesLastSegment: boolean}[];
            matchGoodness: number;
            scoreDebug: any;
        }
    }


    //--------------------------------------------------------------------------
    //
    //  Todo
    //
    //--------------------------------------------------------------------------

    interface InlineDocsProvider {
        (hostEditor: Editor, pos: CodeMirror.Position): JQueryPromise<InlineWidget>
    }

    interface JumpDoDefProvider {
        (): JQueryPromise<boolean>
    }



    interface InlineWidget {
        load(editor: Editor): void
    }



    module MultiRangeInlineEditor {
        class MultiRangeInlineEditor implements InlineWidget {
            constructor(ranges: MultiRangeInlineEditorRange[]);
            load(editor: Editor): void;
        }
    }

    interface MultiRangeInlineEditorRange {
        name: string;
        document: brackets.Document;
        lineStart: number;
        lineEnd: number;
    }

    function getModule(module: 'filesystem/FileSystem'): FileSystem;
    function getModule(module: 'document/DocumentManager'): brackets.DocumentManager;
    function getModule(module: 'project/ProjectManager'): brackets.ProjectManager;
    function getModule(module: 'editor/CodeHintManager'): CodeHintManager;
    function getModule(module: 'editor/EditorManager'): EditorManager;
    function getModule(module: 'editor/MultiRangeInlineEditor'): typeof MultiRangeInlineEditor;
    function getModule(module: 'language/CodeInspection'): CodeInspection;
    function getModule(module: 'view/PanelManager'): PanelManager;
    function getModule(module: 'command/CommandManager'): CommandManager;
    function getModule(module: 'search/QuickOpen'): QuickOpen;
    function getModule(module: 'preferences/PreferencesManager'): PreferencesManager;
    function getModule(module: string): any;

}
