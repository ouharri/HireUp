import { LightningElement, track, api } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import staticResourceName from '@salesforce/resourceUrl/quizeStartImage';
import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';


export default class StartQuizComp extends LightningElement {
    @track imageLink;
    @track imageBgLink;

    @api quiz;
    @api notready = false;

    connectedCallback() {
        this.imageLink = staticResourceName;
        this.imageBgLink = `background-image: url('${quizePatternImage}')`;
    }

    startQuize() {
        this.dispatchEvent(
            new CustomEvent('startquiz')
        );
    }
}