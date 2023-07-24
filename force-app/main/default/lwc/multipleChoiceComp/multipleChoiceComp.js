import { LightningElement, track } from 'lwc';
import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';


export default class MultipleChoiceComp extends LightningElement {
    @track countDown = 30;
    @track imageBgLink;
    timer = null;

    get timerClass() {
        return this.countDown < 10 ? 'warning' : 'count-down';
    }

    countDownTimer() {
        if (this.countDown > 0) {
            this.timer = setTimeout(() => {
                this.countDown--;
                this.countDownTimer();
            }, 1000);
        } else if (this.countDown === 0) {
            // Mettre ici le code à exécuter lorsque le compte à rebours atteint zéro
            // Par exemple, appeler une fonction pour afficher le résultat ou passer à la question suivante
        }
    }

    connectedCallback() {
        this.imageBgLink = `background-image: linear-gradient(
            to left top,
            rgb(255, 255, 255, 0.7),
            rgb(252, 252, 252, 0.7)
          ),url('${quizePatternImage}')`;
        this.countDownTimer();
    }
}