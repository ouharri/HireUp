import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import validateToken from '@salesforce/apex/TokenManager.validateToken';
import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

export default class QuizeLwc extends LightningElement {

    @track isQuizStarted = false;
    @track countDown = 30;
    @track imageBgLink;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            const token = currentPageReference.state?.token;
            this.validateToken(token);
        }
    };

    timer = null;

    get timerClass() {
        return this.countDown < 10 ? 'warning' : 'count-down';
    }

    renderedCallback() {
        Promise.all([
            loadStyle(this, flowbitecss),
            loadScript(this, flowbitejs),
        ])
            .then(() => {
            })
    }

    async validateToken(token) {
        if (token) {
            await validateToken({ encryptedToken: token })
                .then(result => {
                    if (result) {
                        this.handleValidToken();
                    } else {
                        this.handleInvalidToken();
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la validation du token :', error);
                });
        } else {
            this.handleNoToken();
        }
    }

    startQuiz() {
        this.isQuizStarted = true;
    }

    handleValidToken() {
        console.log('Token valide !');
    }

    handleInvalidToken() {
        console.error('Token invalide ou incomplet !');
    }

    handleNoToken() {
        console.error('Token non trouvé dans l\'URL !');
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
