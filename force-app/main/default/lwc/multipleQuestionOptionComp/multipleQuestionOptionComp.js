import { LightningElement, api, track } from 'lwc';
import getAnsswer from '@salesforce/apex/QuizController.getAnsswer';

export default class MultipleQuestionOptionComp extends LightningElement {
    @api option;
    @api answer = [];
    @api isSelected;
    @api isclickednext = false;
    @track optionClassName = 'selected';

    connectedCallback() {
        this.addEventListener('iscklickednext', () => {
            this.handleCorrectAnswer();
        });
    }

    handleCorrectAnswer() {
        console.log('handleCorrectAnswer');
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

}