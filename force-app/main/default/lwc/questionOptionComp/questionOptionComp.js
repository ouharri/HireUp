import { LightningElement, api } from 'lwc';

export default class QuestionOptionComp extends LightningElement {
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