import { LightningElement, api, track } from 'lwc';

export default class ModalComp extends LightningElement {
    @api header = '';
    @api content = '';
    @api footer = '';

    confirmModal() {
        this.dispatchEvent(new CustomEvent('confirm'));
    }

    cancelModal() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }
}