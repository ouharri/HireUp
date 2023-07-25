import { LightningElement, wire, track, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import validateToken from '@salesforce/apex/TokenManager.validateToken';
import getIdsFromToken from '@salesforce/apex/TokenManager.getIdsFromToken';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import getQuizzesWithQuestionsAndOptions from '@salesforce/apex/QuizController.getQuizzesWithQuestionsAndOptions'; import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';

export default class QuizeLwc extends LightningElement {

    @track isQuizStarted = false;
    @track countDown = 30;
    @track imageBgLink;

    @api quiz;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.token = currentPageReference.state?.token;
            this.validateToken(currentPageReference.state?.token);
        }
    };

    token = null;
    timer = null;
    quizId = null;
    LeadId = null;

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
                .then((result) => {
                    if (result) {
                        this.handleValidToken();
                    } else {
                        this.handleInvalidToken(token);
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la validation du token :', error);
                });
        } else {
            this.handleNoToken();
        }
    }

    async handleValidToken() {
        console.log('Token valide ! ');
        await getIdsFromToken({ encryptedToken: this.token })
            .then(result => {
                this.quizId = result.QuizId;
                this.LeadId = result.LeadId;
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des IDs :', error);
            });
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

    startQuiz() {
        this.isQuizStarted = true;
        this.countDownTimer();
    }

    async getQuizzes() {
        await getQuizzesWithQuestionsAndOptions({ quizId: this.quizId })
            .then(result => {
                this.quizzes = result;
                console.log('Quizzes : ', this.quizzes);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des quizzes :', error);
            });
    }

    connectedCallback() {
        this.imageBgLink = `background-image: linear-gradient(
            to left top,
            rgb(255, 255, 255, 0.7),
            rgb(252, 252, 252, 0.7)
          ),url('${quizePatternImage}')`;
    }

}
