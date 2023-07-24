import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class QuizeLwc extends LightningElement {

    token = null;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
       if (currentPageReference) {
          this.token = currentPageReference.state?.token;
       }
    }

    connectedCallback() {
        console.log(this.token);
    }
}