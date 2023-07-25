import { LightningElement, track } from 'lwc';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';



export default class MultipleChoiceComp extends LightningElement {

    renderedCallback() {
        Promise.all([
            loadStyle(this, flowbitecss),
            loadScript(this, flowbitejs),
        ])
            .then(() => {
            })
    }
}