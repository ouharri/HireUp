import { LightningElement, api, track } from 'lwc';
import getAnsswer from '@salesforce/apex/QuizController.getAnsswer';

export default class MultipleQuestionOptionComp extends LightningElement {
    @api option;
    @api answer = [];
    @api isSelected;
    @api isclickednext = false;
    @track optionClassName = 'selected';

    _flag = true

    connectedCallback() {
        this.addEventListener('iscklickednext', () => {
            console.log('this.answer', this.answer);
            this.answer.map((a) => {
                this.optionClassName = (a.AnswerOption__c === this.option.Id) ? 'bg-green-200' : 'bg-red-200';
            });
        });
    }

    disconnectedCallback() {
        this.removeEventListener('iscklickednext', this.handleCustomEvent);
    }

    handleCustomEvent(event) {
        // Call the "handleCorrectAnswer" function here
        this.handleCorrectAnswer();
    }

    handleCorrectAnswer() {
        console.log('handleCorrectAnswer');
        this.optionClassName = 'bg-red-200';
        this.answer.map((a) => {
            if (a.AnswerOption__c === this.option.Id) {
                this.optionClassName = 'bg-green-200';
                return;
            }
        });
    }

    handleOption(event) {
        // if (!this._flag) this._flag = false;

        this.dispatchEvent(
            new CustomEvent('clickedoption', {
                detail: {
                    option: this.option
                }
            })
        );

        // if (this.isclickednext) {
        //     this.answer.map((answer) => {
        //         this.optionClassName = (answer.AnswerOption__c === this.option.Id) ? 'bg-green-200' : 'bg-red-200';
        //     });
        //     this.flag = false;
        // }

    }


}