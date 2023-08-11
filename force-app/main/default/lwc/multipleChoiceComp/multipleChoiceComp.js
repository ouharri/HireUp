import { LightningElement, api, track } from 'lwc';
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
            this.IsClickedNext = true;
            this.template.querySelectorAll('c-multiple-question-option-comp')
                ?.forEach((element) => {
                    element.dispatchEvent(
                        new CustomEvent('iscklickednext', {
                            bubbles: true,
                            composed: true
                        })
                    );
                });
            setTimeout(() => this.IsClickedNext = false, 250);
        });
        this.addEventListener('timeOut', async () => {
            this.IsClickedNext = true;
            await this.handleEvent();
            this.dispatchEvent(
                new CustomEvent('checknextquestion', {
                    detail: this.selectedOptions,
                })
            );
            this.selectedOptions = [];
            this.isDisabled = true;
            setTimeout(() => this.IsClickedNext = false, 1000);
        });
    }

    disconnectedCallback() {
        this.IsClickedNext = false;
    }

    async renderedCallback() {
        this.answer = await getAnsswer({ idQuestion: this.question });
    }

    get nextOrFinish() {
        return 'Next';
    }

    async handleEvent() {
        return new Promise((resolve) => {
            this.dispatchEvent(new CustomEvent('cleartimeout'));
            const event = new CustomEvent('iscklickednext', {
                bubbles: true,
                composed: true,
            });
            const childComponent = this.template.querySelectorAll('c-multiple-question-option-comp');
            if (childComponent && childComponent.length > 0) {
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
                event.detail.AnswerOptionText__c,
                event.detail.Id
            )
        );
        this.isDisabled = (this.selectedOptions.length === 0);
    }

    async setOptionClassName(value) {
        new Promise((resolve) => {
            this.optionClassName = value;
            resolve();
        });
    }

    @api
    async handleNextQuestion() {
        this.IsClickedNext = true;
        await this.handleEvent();
        setTimeout(async () => {
            if (this.selectedOptions.length > 0) {
                again:
                if (!this.answer) {
                    this.answer = await getAnsswer({ idQuestion: this.question });
                    break again
                };
                this.dispatchEvent(
                    new CustomEvent('nextquestion', {
                        detail: JSON.stringify(this.selectedOptions.map((c) => { return c.OptionId })) === JSON.stringify(this.answer.map((c) =>
                            c.AnswerOption__c || c.AnswerText__c
                        ))
                    })
                )
                this.selectedOptions = [];
                this.isDisabled = true;
            }
        }, 250)
    }
}