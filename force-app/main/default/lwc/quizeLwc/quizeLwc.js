import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class QuizeLwc extends LightningElement {

    token = null;
    @track isStart = false;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.token = currentPageReference.state?.token;
        }
    }

    connectedCallback() {
        console.log(this.token);
    }

    startQuize() {
        this.isStart = true;
    }

}