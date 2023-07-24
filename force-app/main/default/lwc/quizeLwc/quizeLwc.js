import { LightningElement } from 'lwc';
export default class QuizeLwc extends LightningElement {
    connectedCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        console.log('token', token);
        // Faites quelque chose avec le token ici
    }
}