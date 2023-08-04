import { LightningElement } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import mirrorcss from '@salesforce/resourceUrl/mirrorcss';
import mirrorjs from '@salesforce/resourceUrl/mirrorjs';
import codemirror from '@salesforce/resourceUrl/codemirror';

const url = 'https://online-code-compiler.p.rapidapi.com/v1/languages/';
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

    async getLanguage() {
        try {
            const response = await fetch(url, options);
            const result = await response.text();
            console.log(result);
        } catch (error) {
            console.error(error);
        }
    }

    async loadEditorResources() {
        try {
            await Promise.all([
                loadScript(this, mirrorjs),
                loadStyle(this, mirrorcss),
                loadStyle(this, codemirror + '/codemirror/lib/codemirror.css'),
            ]).then(async () => {
                await Promise.all([
                    loadScript(this, codemirror + '/codemirror/mode/javascript/javascript.js')
                ])
            });

            this.editor = CodeMirror(this.template.querySelector('[data-ref="editor"]'), {
                lineNumbers: true,
                tabSize: 2,
                padding: 0,
                value: 'console.log("Hello, World");',
                autoCloseBrackets: true,
                matchBrackets: true,
                viewportMargin: 10,
                mode: 'javascript'
            });
            this.editor.setSize("100%", "100%");
            console.log(this.editor.getValue());
        } catch (error) {
            console.error('Error while loading Editor resources:', error);
        }
    }

    connectedCallback() {
        this.loadEditorResources();
        // this.getLanguage();  
    }

    disconnectedCallback() {
        if (this.editor) {
            this.editor.toTextArea();
            this.editor = null;
        }
    }
}
