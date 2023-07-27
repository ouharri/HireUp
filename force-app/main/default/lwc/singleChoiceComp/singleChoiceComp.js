import { LightningElement, api } from 'lwc';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

export default class SingleChoiceComp extends LightningElement {

    @api options;

    renderedCallback() {
        Promise.all([
            loadStyle(this, flowbitecss),
            loadScript(this, flowbitejs),
        ])
            .then(() => {
            })
    }

    AnswerWrapper = class {
        constructor(answerOptionText, questionId) {
            this.OptionText = answerOptionText;
            this.OptionId = questionId;
        }
    }

    handleAnswer(event) {
        this.dispatchEvent(
            new CustomEvent('optionclicked', {
                detail: {
                    "Answer": new this.AnswerWrapper(event.detail.option.AnswerOptionText__c, event.detail.option.Id)
                }
            })
        );
    }
}