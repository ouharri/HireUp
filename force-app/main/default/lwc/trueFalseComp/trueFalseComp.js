import { LightningElement, api, track } from 'lwc';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import getAnsswer from '@salesforce/apex/QuizController.getAnsswer';

export default class TrueFalseComp extends LightningElement {
    @api options;

    @api question;
    @track isClickedNext = false;
    @track answer = '';
    selectedOptions = [{ OptionText: '', OptionId: '' }];

    renderedCallback() {
        Promise.all([
            loadStyle(this, flowbitecss),
            loadScript(this, flowbitejs),
        ])
            .then(() => {
            })
    }

    AnswerWrapper = class {
        constructor(answerOptionText = '', questionId = '') {
            this.OptionText = answerOptionText;
            this.OptionId = questionId;
        }
    }

    addObjectToArray(objectToAdd) {
        return new Promise((resolve) => {
            this.selectedOptions = [];
            this.selectedOptions.push(objectToAdd);
            resolve();
        });

    }

    async handleEvent() {
        return new Promise((resolve) => {
            this.dispatchEvent(new CustomEvent('cleartimeout'));
            const event = new CustomEvent('iscklickednext', {
                bubbles: true,
                composed: true,
            });
            const childComponent = this.template.querySelectorAll('c-single-question-option-comp');
            if (childComponent && childComponent.length > 0) {
                childComponent.forEach((element) => {
                    element.dispatchEvent(event);
                });
            }
            resolve();
        });
    }

    async handleAnswer(event) {
        this.isClickedNext = true;
        await this.addObjectToArray(
            new this.AnswerWrapper(
                event.detail.AnswerOptionText__c,
                event.detail.Id
            )
        );
        await this.handleEvent();
        setTimeout(() => {
            this.dispatchEvent(
                new CustomEvent('nextquestion', {
                    detail: this.selectedOptions,
                })
            )
        }, 250)
    }

    async renderedCallback() {
        this.answer = await getAnsswer({ idQuestion: this.question });
    }

    connectedCallback() {
        this.addObjectToArray(this.AnswerWrapper);
        this.addEventListener('iscklickednextquestion', (event) => {
            this.isClickedNext = true;
            this.template.querySelectorAll('c-single-question-option-comp')
                ?.forEach((element) => {
                    element.dispatchEvent(
                        new CustomEvent('iscklickednext', {
                            bubbles: true,
                            composed: true
                        })
                    );
                });
            setTimeout(() => this.isClickedNext = false, 250);
        });
        this.addEventListener('timeOut', async () => {
            this.isClickedNext = true;
            await this.handleEvent();
            this.dispatchEvent(
                new CustomEvent('checknextquestion', {
                    detail: this.selectedOptions,
                })
            );
            setTimeout(() => this.isClickedNext = false, 1000);
        });
    }

    disconnectedCallback() {
        this.IsClickedNext = false;
    }
}