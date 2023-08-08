import { LightningElement, api, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import mirrorcss from '@salesforce/resourceUrl/mirrorcss';
import mirrorjs from '@salesforce/resourceUrl/mirrorjs';
import codemirror from '@salesforce/resourceUrl/codemirror';

const url = 'https://online-code-compiler.p.rapida  pi.com/v1/';
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': '50c8283de5msh9a363fa31f44eb7p1a0ad7jsn55c4b7c0c636',
        'X-RapidAPI-Host': 'online-code-compiler.p.rapidapi.com'
    }
};

export default class CodeEditorComp extends LightningElement {
    @track editorInitialized = false;
    @track editor = null;
    @track isFullScreenEditor = false;
    @track fullScreenButton = 'fullScreenButton cursor-pointer';

    @api questionattribute = { codeInit: [{ Language__c: '', codeText__c: '' }], unitTests: [] };
    @track language = {
        value: 'a098e000002nrwXAAQ',
        text: 'nodejs'
    };


    async getLanguage() {
        try {
            const response = await fetch(url + 'languages/', options);
            const result = await response.text();
            console.log(result);
        } catch (error) {
            console.error(error);
        }
    }

    async runCode() {
        // const options_post = {
        //     method: 'POST',
        //     headers: {
        //         'content-type': 'application/json',
        //         'X-RapidAPI-Key': '50c8283de5msh9a363fa31f44eb7p1a0ad7jsn55c4b7c0c636',
        //         'X-RapidAPI-Host': 'online-code-compiler.p.rapidapi.com'
        //     },
        //     body: JSON.stringify({
        //         language: this.language.text,
        //         version: 'latest',
        //         code: this.editor.getValue(),
        //         input: `6
        //         1 2 3 4 10 11
        //         `,
        //     })
        // };

        // try {
        //     const response = await fetch('https://online-code-compiler.p.rapidapi.com/v1/', options_post);
        //     const result = await response.text();
        //     console.log(
        //         JSON.parse(result).output
        //     );
        // } catch (error) {
        //     console.error(error);
        // }


    }

    async autoEditorFullScreen() {
        await Promise.all([
            this.editor.setOption("fullScreen", !this.isFullScreenEditor),
            this.isFullScreenEditor = !this.isFullScreenEditor,
            this.editor.refresh(),
        ]).then(() => {
            this.dispatchEvent(
                new CustomEvent('fullscreentimer', {
                    detail: this.isFullScreenEditor
                })
            );
        });
        if (this.isFullScreenEditor) {
            this.fullScreenButton = 'fullScreenButton cursor-pointer fullScreenButtonClass';
        } else {
            this.fullScreenButton = 'cursor-pointer fullScreenButton';
        }
    }

    async setlanguagevalue(event) {
        this.editorInitialized = false;
        await Promise.all([
            this.language = {
                value: event.target.value,
                text: event.target.options[event.target.selectedIndex].text
            },
            this.editor.setOption("mode", (this.language.text === 'nodejs' && 'javascript') || (this.language.text === 'java' && 'text/x-java') || this.language.text),
            this.editor.setValue(this.convertToPlain(
                this.questionattribute.codeInit
                    .filter((item) => item.Language__c === this.language.value)
                    .map((item) => item.codeText__c)[0]
            )),
            this.editor.refresh(),
        ]).then(() => {
            this.editorInitialized = true;
        });
    }

    async resetEditorCode() {
        this.editorInitialized = false;
        await Promise.all([
            this.editor.setValue(this.convertToPlain(
                this.questionattribute.codeInit
                    .filter((item) => item.Language__c === this.language.value)
                    .map((item) => item.codeText__c)[0]
            ))
        ]).then(() => {
            this.editorInitialized = true;
        });
    }

    initEditor() {
        if (!this.editorInitialized) {
            this.template.querySelector('[data-ref="editor"]').innerHTML = '';
            CodeMirror.defineExtension("autoIndentRange", function (from, to) {
                var cmInstance = this;
                this.operation(function () {
                    for (var i = from.line; i <= to.line; i++) {
                        cmInstance.indentLine(i, "smart");
                    }
                });
            });
            CodeMirror.defineExtension("autoFormatRange", function (from, to) {
                var cm = this;
                var outer = cm.getMode(), text = cm.getRange(from, to).split("\n");
                var state = CodeMirror.copyState(outer, cm.getTokenAt(from).state);
                var tabSize = cm.getOption("tabSize");

                var out = "", lines = 0, atSol = from.ch == 0;
                function newline() {
                    out += "\n";
                    atSol = true;
                    ++lines;
                }

                for (var i = 0; i < text.length; ++i) {
                    var stream = new CodeMirror.StringStream(text[i], tabSize);
                    while (!stream.eol()) {
                        var inner = CodeMirror.innerMode(outer, state);
                        var style = outer.token(stream, state), cur = stream.current();
                        stream.start = stream.pos;
                        if (!atSol || /\S/.test(cur)) {
                            out += cur;
                            atSol = false;
                        }

                        if (!atSol && inner.mode.newlineAfterToken &&
                            inner.mode.newlineAfterToken(style, cur, stream.string.slice(stream.pos) || text[i + 1] || "", inner.state))
                            newline();
                    }
                    if (!stream.pos && outer.blankLine) outer.blankLine(state);
                    if (!atSol) newline();
                }

                cm.operation(function () {
                    cm.replaceRange(out, from, to);
                    for (var cur = from.line + 1, end = from.line + lines; cur <= end; ++cur)
                        cm.indentLine(cur, "smart");
                    cm.setSelection(from, cm.getCursor(false));
                });
            });

            this.editor = CodeMirror(this.template.querySelector('[data-ref="editor"]'), {
                lineNumbers: true,
                tabSize: 2,
                padding: 0,
                value: this.convertToPlain(
                    this.questionattribute.codeInit
                        .filter((item) => item.Language__c === this.language.value)
                        .map((item) => item.codeText__c)[0]
                ),
                autoCloseBrackets: true,
                matchBrackets: true,
                viewportMargin: 10,
                mode: (this.language.text === 'nodejs' && 'javascript') || (this.language.text === 'java' && 'text/x-java') || this.language.text,
                autoIndentRange: true,
                autoFormatRange: true,
                matchTags: { bothTags: true },
                showTrailingSpace: true,
                styleActiveLine: true,
                lineWrapping: true,
                fullScreen: false,
                autoCloseTags: true,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                scrollbarStyle: 'overlay',
                extraKeys: { "Shift-Tab": this.autoFormatSelection }
            });
            this.editor.setSize("100%", "100%");
            const totalLines = this.editor.lineCount();
            this.editor.autoFormatRange({ line: 0, ch: 0 }, { line: totalLines });
            this.editorInitialized = true;
        }
    }

    getSelectedRange() {
        return { from: this.editor.getCursor(true), to: this.editor.getCursor(false) };
    }

    autoFormatSelection() {
        var range = this.getSelectedRange();
        this.editor.autoFormatRange(range.from, range.to);
    }


    convertToPlain(plainText) {
        plainText = plainText.replace(/<style([\s\S]*?)<\/style>/gi, '');
        plainText = plainText.replace(/<script([\s\S]*?)<\/script>/gi, '');
        plainText = plainText.replace(/<\/div>/ig, '\n');
        plainText = plainText.replace(/<\/li>/ig, '\n  *  ');
        plainText = plainText.replace(/<li>/ig, '  *  ');
        plainText = plainText.replace(/<\/ul>/ig, '\n');
        plainText = plainText.replace(/<\/p>/ig, '\n');
        plainText = plainText.replace(/<p>/ig, '');
        plainText = plainText.replace(/<br\s*[\/]?>/gi, '\n \n');
        plainText = plainText.replace(/<(?!\/?(div|li|ul|p))[^>]+>/ig, '');
        plainText = plainText.trim();
        plainText = plainText.replace(/\{/g, ' {\n  ');
        plainText = plainText.replace(/\}/g, '\n\n}\n\n');
        plainText = plainText.replace(/\(/g, ' (');
        plainText = plainText.replace(/\)/g, ')');
        plainText = plainText.replace(/\[/g, ' [');
        plainText = plainText.replace(/\]/g, ']');
        plainText = plainText.replace(/</g, ' <');
        plainText = plainText.replace(/>/g, '>');
        plainText = plainText.replace(/,/g, ', ');
        plainText = plainText.replace(/:/g, ': ');
        plainText = plainText.replace(/(^|\n)(\s*\/\*(.*?)\*\/)(\n|$)/g, '\n\n$2\n\n');
        plainText = plainText.replace(/(^|\n)(\s*\/\/[^\n]*)/g, '\n\n$2\n\n');
        plainText = plainText.replace(/\n\s*\n/g, '\n');
        plainText = plainText.replace(/\n\s*\/\//g, '\n//');
        plainText = plainText.replace(/\/\s*\n/g, '/\n');
        plainText = plainText.replace(/ \*\//g, ' */\n\n');
        plainText = plainText.replace(/ \//g, '/');
        plainText = plainText.replace(/\/\/ /g, '//');
        plainText = plainText.replace(/\}\s*/g, '}\n\n');

        const tempDivElement = document.createElement("div");
        tempDivElement.innerHTML = plainText;

        return tempDivElement.innerText;
    }

    async loadEditorResources() {
        try {
            await Promise.all([
                loadScript(this, mirrorjs),
                loadStyle(this, mirrorcss),
                loadStyle(this, codemirror + '/codemirror/lib/codemirror.css'),
            ]).then(async () => {
                await Promise.all([
                    loadScript(this, codemirror + '/codemirror/addon/display/fullscreen.js'),
                    loadStyle(this, codemirror + '/codemirror/addon/display/fullscreen.css'),
                    loadScript(this, codemirror + '/codemirror/addon/scroll/simplescrollbars.js'),
                    loadStyle(this, codemirror + '/codemirror/addon/scroll/simplescrollbars.css'),
                    loadScript(this, codemirror + '/codemirror/addon/comment/comment.js'),
                    loadScript(this, codemirror + '/codemirror/addon/comment/continuecomment.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/closebrackets.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/matchbrackets.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/matchtags.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/trailingspace.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/closetag.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/continuelist.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/matchbrackets.js'),
                    loadScript(this, codemirror + '/codemirror/addon/edit/matchtags.js'),
                    loadScript(this, codemirror + '/codemirror/addon/fold/brace-fold.js'),
                    loadScript(this, codemirror + '/codemirror/addon/fold/comment-fold.js'),
                    loadScript(this, codemirror + '/codemirror/addon/fold/foldcode.js'),
                    loadScript(this, codemirror + '/codemirror/addon/fold/foldgutter.js'),
                    loadScript(this, codemirror + '/codemirror/addon/fold/indent-fold.js'),
                    loadScript(this, codemirror + '/codemirror/addon/fold/markdown-fold.js'),
                    loadScript(this, codemirror + '/codemirror/addon/fold/xml-fold.js'),
                    loadScript(this, codemirror + '/codemirror/addon/hint/show-hint.js'),
                    loadStyle(this, codemirror + '/codemirror/addon/hint/show-hint.css'),
                    loadScript(this, codemirror + '/codemirror/addon/hint/anyword-hint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/hint/css-hint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/hint/html-hint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/hint/javascript-hint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/hint/sql-hint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/hint/xml-hint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/lint/lint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/lint/javascript-lint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/lint/json-lint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/lint/css-lint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/lint/html-lint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/lint/yaml-lint.js'),
                    loadScript(this, codemirror + '/codemirror/addon/mode/loadmode.js'),
                    loadScript(this, codemirror + '/codemirror/addon/mode/multiplex.js'),
                    loadScript(this, codemirror + '/codemirror/addon/runmode/runmode.js'),
                    loadScript(this, codemirror + '/codemirror/addon/runmode/colorize.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/search.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/searchcursor.js'),
                    loadScript(this, codemirror + '/codemirror/addon/dialog/dialog.js'),
                    loadStyle(this, codemirror + '/codemirror/addon/dialog/dialog.css'),
                    loadScript(this, codemirror + '/codemirror/addon/search/jump-to-line.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/match-highlighter.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/matchesonscrollbar.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/match-highlighter.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/matchesonscrollbar.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/match-highlighter.js'),
                    loadScript(this, codemirror + '/codemirror/addon/search/matchesonscrollbar.js'),
                    loadScript(this, codemirror + '/codemirror/addon/scroll/annotatescrollbar.js'),
                    loadScript(this, codemirror + '/codemirror/addon/scroll/scrollpastend.js'),
                    loadScript(this, codemirror + '/codemirror/addon/scroll/simplescrollbars.js'),
                    loadScript(this, codemirror + '/codemirror/mode/javascript/javascript.js'),
                    loadScript(this, codemirror + '/codemirror/mode/php/php.js'),
                    loadScript(this, codemirror + '/codemirror/mode/xml/xml.js'),
                    loadScript(this, codemirror + '/codemirror/mode/css/css.js'),
                    loadScript(this, codemirror + '/codemirror/mode/htmlmixed/htmlmixed.js'),
                    loadScript(this, codemirror + '/codemirror/mode/clike/clike.js'),
                    loadScript(this, codemirror + '/codemirror/mode/python/python.js'),
                    loadScript(this, codemirror + '/codemirror/mode/ruby/ruby.js'),
                    loadScript(this, codemirror + '/codemirror/mode/swift/swift.js'),
                    loadScript(this, codemirror + '/codemirror/mode/go/go.js'),
                    loadScript(this, codemirror + '/codemirror/mode/sql/sql.js'),
                    loadScript(this, codemirror + '/codemirror/mode/shell/shell.js'),
                    loadScript(this, codemirror + '/codemirror/mode/markdown/markdown.js'),
                    loadScript(this, codemirror + '/codemirror/mode/dart/dart.js'),
                    loadScript(this, codemirror + '/codemirror/mode/clojure/clojure.js'),
                    loadScript(this, codemirror + '/codemirror/mode/perl/perl.js'),
                    loadScript(this, codemirror + '/codemirror/mode/erlang/erlang.js'),
                    loadScript(this, codemirror + '/codemirror/mode/coffeescript/coffeescript.js'),
                    loadScript(this, codemirror + '/codemirror/mode/groovy/groovy.js'),
                    loadScript(this, codemirror + '/codemirror/mode/yaml/yaml.js'),
                    loadScript(this, codemirror + '/codemirror/mode/crystal/crystal.js'),
                    loadScript(this, codemirror + '/codemirror/mode/elm/elm.js'),
                    loadScript(this, codemirror + '/codemirror/mode/haskell/haskell.js'),
                    loadScript(this, codemirror + '/codemirror/mode/lua/lua.js'),
                    loadScript(this, codemirror + '/codemirror/mode/pascal/pascal.js'),
                    loadScript(this, codemirror + '/codemirror/mode/perl/perl.js'),
                    loadScript(this, codemirror + '/codemirror/mode/powershell/powershell.js'),
                    loadScript(this, codemirror + '/codemirror/mode/r/r.js'),
                    loadScript(this, codemirror + '/codemirror/mode/ruby/ruby.js'),
                    loadScript(this, codemirror + '/codemirror/mode/sass/sass.js'),
                    loadScript(this, codemirror + '/codemirror/mode/stylus/stylus.js'),
                    loadScript(this, codemirror + '/codemirror/mode/tcl/tcl.js'),
                    loadScript(this, codemirror + '/codemirror/mode/toml/toml.js'),
                    loadScript(this, codemirror + '/codemirror/mode/vue/vue.js'),
                    loadScript(this, codemirror + '/codemirror/mode/yaml-frontmatter/yaml-frontmatter.js'),
                    loadScript(this, codemirror + '/codemirror/mode/z80/z80.js'),
                    loadScript(this, codemirror + '/codemirror/mode/django/django.js'),
                    loadScript(this, codemirror + '/codemirror/mode/gherkin/gherkin.js'),
                    loadScript(this, codemirror + '/codemirror/mode/http/http.js'),
                    loadScript(this, codemirror + '/codemirror/mode/julia/julia.js'),
                    loadScript(this, codemirror + '/codemirror/mode/livescript/livescript.js'),
                    loadScript(this, codemirror + '/codemirror/mode/mllike/mllike.js'),
                    loadScript(this, codemirror + '/codemirror/mode/nginx/nginx.js'),
                    loadScript(this, codemirror + '/codemirror/mode/puppet/puppet.js'),
                    loadScript(this, codemirror + '/codemirror/mode/q/q.js'),
                    loadScript(this, codemirror + '/codemirror/mode/smalltalk/smalltalk.js'),
                    loadScript(this, codemirror + '/codemirror/mode/tiddlywiki/tiddlywiki.js'),
                    loadScript(this, codemirror + '/codemirror/mode/tiki/tiki.js'),
                    loadScript(this, codemirror + '/codemirror/mode/vb/vb.js'),
                    loadScript(this, codemirror + '/codemirror/mode/vhdl/vhdl.js'),
                ])
            });
            this.code = this.questionattribute.codeInit
                .filter((item) => item.Language__c === this.language.value)
                .map((item) => item.codeText__c)[0];
            this.initEditor();
        } catch (error) {
            console.error('Error while loading Editor resources:', error);
        }
    }

    connectedCallback() {
        this.loadEditorResources();
    }

    renderedCallback() {
        let select = this.template.querySelector('[name="languageSelect"]');
        if (select) {
            this.language = {
                value: select.options[select.selectedIndex].value,
                text: select.options[select.selectedIndex].text
            };
            this.loadEditorResources();
        }
    }

    disconnectedCallback() {
        if (this.editor) {
            this.editor = null;
        }
    }
}
