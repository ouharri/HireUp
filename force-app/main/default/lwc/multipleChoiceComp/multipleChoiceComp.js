import { LightningElement, api, track } from 'lwc';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import getAnsswer from '@salesforce/apex/QuizController.getAnsswer';

export default class MultipleChoiceComp extends LightningElement {

    @api options;
    selectedOptions = [];
    @track isDisabled = true;
    @api question;
    @track answer = '';
    @track IsClickedNext = false;


    connectedCallback() {
        this.addEventListener('iscklickednextquestion', (event) => {
            console.log('ggg');
            this.template.querySelectorAll('c-multiple-question-option-comp')
                ?.forEach((element) => {
                    element.dispatchEvent(
                        new CustomEvent('iscklickednext', {
                            bubbles: true,
                            composed: true
                        })
                    );
                });
        });
    }


    async handleEvent() {
        return new Promise((resolve) => {
            this.dispatchEvent(new CustomEvent('clicked-next'));
            const event = new CustomEvent('iscklickednext',
                {
                    bubbles: true,
                    composed: true,
                });
            const childComponent = this.template.querySelectorAll('c-multiple-question-option-comp');
            if (childComponent.length > 0) {
                childComponent.forEach((element) => {
                    element.dispatchEvent(event);
                });
            }
            resolve();
        });
    }



    AnswerWrapper = class {
        constructor(answerOptionText, questionId) {
            this.OptionText = answerOptionText;
            this.OptionId = questionId;
        }
    }

    addOrRemoveObjectFromArray(objectToAdd) {
        const index = this.selectedOptions.findIndex(
            item => JSON.stringify(item) === JSON.stringify(objectToAdd)
        );
        if (index === -1) {
            this.selectedOptions.push(objectToAdd);
        } else {
            this.selectedOptions.splice(index, 1);
        }
    }

    handelSelectedOptions(event) {
        this.addOrRemoveObjectFromArray(
            new this.AnswerWrapper(
                event.detail.option.AnswerOptionText__c,
                event.detail.option.Id
            )
        );
        this.isDisabled = (this.selectedOptions.length === 0);
        // this.handleAnswer(this.selectedOptions);
    }

    async setOptionClassName(value) {
        new Promise((resolve) => {
            this.optionClassName = value;
            resolve();
        });
    }

    // handleAnswer() {
    //     this.dispatchEvent(
    //         new CustomEvent('optionclicked', {
    //             detail: this.selectedOptions
    //         })
    //     );
    // }

    async renderedCallback() {
        this.answer = await getAnsswer({ idQuestion: this.question });
    }

    @api
    async handleNextQuestion() {
        this.IsClickedNext = true;
        await this.handleEvent();
        setTimeout(() => {
            if (this.selectedOptions.length > 0) {
                this.dispatchEvent(
                    new CustomEvent('nextquestion', {
                        detail: this.selectedOptions
                    })
                )
                this.IsClickedNext = false;
                this.selectedOptions = [];
                this.isDisabled = true;
            }
        }, 1000)
    }
}