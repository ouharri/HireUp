import { LightningElement, api, track } from 'lwc';

export default class SingleQuestionOptionComp extends LightningElement {
    @api option;
    @api answer = [];
    @api isSelected;
    @api isclickednext = false;
    @track optionClassName = 'selected';

    handleOption(event) {
        this.dispatchEvent(
            new CustomEvent('clickedoption', {
                detail: this.option
            })
        );
    }

    handleCorrectAnswer() {
        this.optionClassName = 'bg-red-400';
        this.answer.map((a) => {
            if (a.AnswerOption__c === this.option.Id) {
                this.optionClassName = 'bg-green-400';
                return;
            }
        });
    }

    handleOption(event) {
        this.dispatchEvent(
            new CustomEvent('clickedoption', {
                detail: this.option
            })
        );
    }

    connectedCallback() {
        this.addEventListener('iscklickednext', () => {
            this.handleCorrectAnswer();
        });
    }
}