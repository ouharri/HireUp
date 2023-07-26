import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import validateToken from '@salesforce/apex/TokenManager.validateToken';
import getIdsFromToken from '@salesforce/apex/TokenManager.getIdsFromToken';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import getQuizzesWithQuestionsAndOptions from '@salesforce/apex/QuizController.getQuizzesWithQuestionsAndOptions';
import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';

export default class QuizeLwc extends LightningElement {
    @track isQuizStarted = false;
    @track countDown = 30;
    @track imageBgLink;

    questions;
    quiz = { 'Name': '', 'Description__c': '', 'Duration__c': '' };

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.token = currentPageReference.state?.token;
            this.validateToken(currentPageReference.state?.token);
        }
    }

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
                // Code à exécuter après le chargement des ressources
            })
            .catch(error => {
                console.error('Erreur lors du chargement des ressources :', error);
            });
    }

    async validateToken(token) {
        if (token) {
            try {
                const result = await validateToken({ encryptedToken: token });
                if (result) {
                    this.handleValidToken();
                } else {
                    this.handleInvalidToken(token);
                }
            } catch (error) {
                console.error('Erreur lors de la validation du token :', error);
            }
        } else {
            this.handleNoToken();
        }
    }

    async handleValidToken() {
        console.log('Token valide !');
        try {
            const result = await getIdsFromToken({ encryptedToken: this.token });
            if (result && result.QuizId && result.LeadId) {
                this.quizId = result.QuizId;
                this.LeadId = result.LeadId;
                await this.getQuizzes();
            } else {
                console.error('Invalid data retrieved from the token.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des IDs :', error);
        }
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
            // Countdown reached zero, handle the end of the quiz or move to the next question.
            // For example:
            this.handleQuizEnd();
        }
    }

    handleQuizEnd() {
        // Code to handle the end of the quiz, show results, etc.
        // For example, clear the timer:
        clearTimeout(this.timer);
        this.countDownTimer();
        this.countDown = 30;
    }

    startQuiz() {
        this.isQuizStarted = true;
        this.countDownTimer();
    }

    async getQuizzes() {
        try {
            console.log('quizId : ', this.quizId);
            console.log('LeadId : ', this.LeadId);
            const result = await getQuizzesWithQuestionsAndOptions({ quizId: this.quizId });
            console.log('result : ', result);
            if (result && result.quiz) {
                this.questions = result.questions;
                this.quiz = result.quiz;
                console.log('questions : ', this.questions);
                console.log('Quiz : ', this.quiz);
            } else {
                console.error('No quiz data found for the given quizId.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des quizzes :', error);
        }
    }

    connectedCallback() {
        this.imageBgLink = `background-image: linear-gradient(
            to left top,
            rgb(255, 255, 255, 0.7),
            rgb(252, 252, 252, 0.7)
          ),url('${quizePatternImage}')`;
    }
}