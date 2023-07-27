import { LightningElement,api } from 'lwc';

export default class MultipleQuestionOptionComp extends LightningElement {
    @api option;

    handleOption(event) {
        this.dispatchEvent(
            new CustomEvent('clickedoption', {
                detail: {
                    "option": this.option
                }
            })
        );
    }
}