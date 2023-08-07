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
    editorInitialized = false;
    editor = null;

    @api questionattribute = { codeInit: [{ Language__c: '', codeText__c: '' }], unitTests: [] };
    @track language = 'a098e000002nrwXAAQ';
    @track code = '';


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
        const options_post = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': '50c8283de5msh9a363fa31f44eb7p1a0ad7jsn55c4b7c0c636',
                'X-RapidAPI-Host': 'online-code-compiler.p.rapidapi.com'
            },
            body: JSON.stringify({
                language: this.language,
                version: 'latest',
                code: this.editor.getValue(),
                input: null
            })
        };

        try {
            const response = await fetch('https://online-code-compiler.p.rapidapi.com/v1/', options_post);
            const result = await response.text();
            console.log(
                JSON.parse(result).output
            );
        } catch (error) {
            console.error(error);
        }
    }

    async setlanguagevalue(event) {
        await Promise.all([
            this.language = event.target.value,
            this.editorInitialized = false
        ]).then(() => {
            this.code = this.convertToPlain(
                this.questionattribute.codeInit
                    .filter((item) => item.Language__c === this.language)
                    .map((item) => item.codeText__c)[0]
            );
        });
        await this.loadEditorResources().then(() => {
            this.initEditor();
        });
    }

    initEditor() {
        if (!this.editorInitialized) {
            this.template.querySelector('[data-ref="editor"]').innerHTML = '';

            CodeMirror.defineExtension("commentRange", function (isComment, from, to) {
                var cm = this, curMode = CodeMirror.innerMode(cm.getMode(), cm.getTokenAt(from).state).mode;
                cm.operation(function () {
                    if (isComment) { // Comment range
                        cm.replaceRange(curMode.commentEnd, to);
                        cm.replaceRange(curMode.commentStart, from);
                        if (from.line == to.line && from.ch == to.ch) // An empty comment inserted - put cursor inside
                            cm.setCursor(from.line, from.ch + curMode.commentStart.length);
                    } else { // Uncomment range
                        var selText = cm.getRange(from, to);
                        var startIndex = selText.indexOf(curMode.commentStart);
                        var endIndex = selText.lastIndexOf(curMode.commentEnd);
                        if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
                            // Take string till comment start
                            selText = selText.substr(0, startIndex)
                                // From comment start till comment end
                                + selText.substring(startIndex + curMode.commentStart.length, endIndex)
                                // From comment end till string end
                                + selText.substr(endIndex + curMode.commentEnd.length);
                        }
                        cm.replaceRange(selText, from, to);
                    }
                });
            });
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
                        .filter((item) => item.Language__c === this.language)
                        .map((item) => item.codeText__c)[0]
                ),
                autoCloseBrackets: true,
                matchBrackets: true,
                viewportMargin: 10,
                mode: 'javascript',
                commentRange: true,
                autoIndentRange: true,
                autoFormatRange: true,
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

    decodeHtmlEntities(text) {
        const entityMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#039;': "'",
            // Add more entity mappings if needed
        };
        return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, function (match) {
            return entityMap[match];
        });
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
        plainText = plainText.replace(/\}/g, '\n\n}');
        plainText = plainText.replace(/\(/g, ' (');
        plainText = plainText.replace(/\)/g, ')');
        plainText = plainText.replace(/\[/g, ' [');
        plainText = plainText.replace(/\]/g, ']');
        plainText = plainText.replace(/</g, ' <');
        plainText = plainText.replace(/>/g, '>');
        plainText = plainText.replace(/,/g, ', ');
        plainText = plainText.replace(/:/g, ': ');
        plainText = plainText.replace(/(^|\n)(\s*\/\*(.*?)\*\/)(\n|$)/g, '\n$2\n');
        plainText = plainText.replace(/(^|\n)(\s*\/\/[^\n]*)/g, '\n\n$2\n\n');
        plainText = plainText.replace(/\n\s*\n/g, '\n');
        plainText = plainText.replace(/ \*\//g, ' */\n');
        plainText = plainText.replace(/ \//g, '/');
        plainText = plainText.replace(/\/\/ /g, '//');

        const tempDivElement = document.createElement("div");
        tempDivElement.innerHTML = plainText;

        return tempDivElement.innerText;;
    }


    async loadEditorResources() {
        try {
            await Promise.all([
                loadScript(this, mirrorjs),
                loadStyle(this, mirrorcss),
                loadStyle(this, codemirror + '/codemirror/lib/codemirror.css'),
            ]).then(async () => {
                await Promise.all([
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
                .filter((item) => item.Language__c === this.language)
                .map((item) => item.codeText__c)[0];
            this.initEditor();
        } catch (error) {
            console.error('Error while loading Editor resources:', error);
        }
    }

    renderedCallback() {
        // this.language =
        //     this.template.querySelector('[data-ref="languageSelect"]')
        //         .target.value;
        this.code = this.questionattribute.codeInit
            .filter((item) => item.Language__c === this.language)
            .map((item) => item.codeText__c)[0];
        this.loadEditorResources();

        console.log(
            this.questionattribute.codeInit
                .filter((item) => item.Language__c === this.language)
                .map((item) => item.codeText__c)[0]
        );
        // this.getLanguage();
    }

    disconnectedCallback() {
        if (this.editor) {
            this.editor = null;
        }
    }
}
