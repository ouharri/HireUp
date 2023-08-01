import { LightningElement, wire, track, api } from 'lwc';
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
    @track currentQuestion = 1;
    @track countDown = 30;
    @track question = '';
    @track imageBgLink = '';

    @track questions = [];
    answerOptions = [];
    isQlickedNextQuestion = false;
    quiz = { 'Name': 'QUIZ', 'Description__c': '', 'Duration__c': '' };

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
    screenWithDesktop = 0;

    @track MULTIPLE_CHOICE = false;
    @track SINGLE_CHOICE = false;
    @track TRUE_FALSE = false;
    @track SHORT_ANSWER = false;
    @track CURSOR = false;
    @track PUZZLE = false;
    @track SURVEY = false;

    QUESTION_TYPES = {
        MULTIPLE_CHOICE: 'multiple choice',
        SINGLE_CHOICE: 'single choice',
        TRUE_FALSE: 'true/false',
        SHORT_ANSWER: 'short answer',
        CURSOR: 'Cursor',
        PUZZLE: 'Puzzle',
        SURVEY: 'Sondage'
    };

    createAnswerWrapper(answerOptionText, questionId) {
        return {
            OptionText: answerOptionText,
            OptionId: questionId
        };
    }

    setCountDown = (value) => {
        return new Promise((resolve) => {
            this.countDown = value;
            resolve();
        });
    };

    setQuestions = (value) => {
        return new Promise((resolve) => {
            this.questions = value.map(question => {
                return {
                    ...question,
                    statutClass: 'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-gray-200'
                }
            });
            resolve();
        });
    };

    setQuestion = (value) => {
        return new Promise((resolve) => {
            this.question = value;
            resolve();
        });
    };

    setQuiz = (value) => {
        return new Promise((resolve) => {
            this.quiz = value;
            resolve();
        });
    };

    setAnswerOptions = (value) => {
        return new Promise((resolve) => {
            this.answerOptions = this.fisherYatesShuffle(value);
            resolve();
        });
    };

    async setQuestionType(value) {
        await this.setDefaultQuestionType();
        return new Promise((resolve) => {
            switch (value) {
                case this.QUESTION_TYPES.MULTIPLE_CHOICE:
                    this.MULTIPLE_CHOICE = true;
                    break;
                case this.QUESTION_TYPES.SINGLE_CHOICE:
                    this.SINGLE_CHOICE = true;
                    break;
                case this.QUESTION_TYPES.TRUE_FALSE:
                    this.TRUE_FALSE = true;
                    break;
                case this.QUESTION_TYPES.SHORT_ANSWER:
                    this.SHORT_ANSWER = true;
                    break;
                case this.QUESTION_TYPES.CURSOR:
                    this.CURSOR = true;
                    break;
                case this.QUESTION_TYPES.PUZZLE:
                    this.PUZZLE = true;
                    break;
                case this.QUESTION_TYPES.SURVEY:
                    this.SURVEY = true;
                    break;
                default:
                    this.MULTIPLE_CHOICE = true;
                    break;
            }
            resolve();
        });
    }

    setDefaultQuestionType = () => {
        return new Promise((resolve) => {
            this.MULTIPLE_CHOICE = false;
            this.SINGLE_CHOICE = false;
            this.TRUE_FALSE = false;
            this.SHORT_ANSWER = false;
            this.CURSOR = false;
            this.PUZZLE = false;
            this.SURVEY = false;
            resolve();
        });
    }

    incrementCurrentQuestion = () => {
        return new Promise((resolve) => {
            this.currentQuestion++;
            resolve();
        });
    };

    setIsNotQlickedNextQuestion = () => {
        return new Promise((resolve) => {
            this.isQlickedNextQuestion = false;
            resolve();
        });
    };

    setIsQlickedNextQuestion = () => {
        return new Promise((resolve) => {
            this.isQlickedNextQuestion = true;
            resolve();
        });
    };

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
                    this.handleInvalidToken();
                }
            } catch (error) {
                console.error('Erreur lors de la validation du token :', error);
            }
        } else {
            this.handleNoToken();
        }
    }


    // //////////////////// //

    async handleValidToken() {
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

    fisherYatesShuffle(array) {
        const copyArray = JSON.parse(JSON.stringify(array)); // Create a deep copy
        for (let i = copyArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copyArray[i], copyArray[j]] = [copyArray[j], copyArray[i]];
        }
        return copyArray;
    }

    countDownTimer() {
        if (this.countDown > 0 && !this.isQlickedNextQuestion) {
            this.timer = setTimeout(() => {
                this.countDown--;
                this.countDownTimer();
            }, 1000);
        } else if (this.countDown === 0) {

            switch (this.question.QuestionType__c) {
                case this.QUESTION_TYPES.MULTIPLE_CHOICE:
                    this.template.querySelector('c-multiple-choice-comp').dispatchEvent(
                        new CustomEvent('timeOut', {
                            bubbles: true,
                            composed: true,
                        })
                    );
                    break;
                case this.QUESTION_TYPES.SINGLE_CHOICE:
                    this.template.querySelector('c-single-choice-comp').dispatchEvent(
                        new CustomEvent('timeOut', {
                            bubbles: true,
                            composed: true,
                        })
                    );
                    break;
                case this.QUESTION_TYPES.TRUE_FALSE:
                    break;
            }

            if (this.currentQuestion === this.questions.length) {
                this.handleQuizEnd();
            } else {
                this.handleNextQuestion();
            }
        } else {
            clearTimeout(this.timer);
        }
    }

    async openFullscreen() {
        await (this.template.querySelector('.app').requestFullscreen() ||
            this.template.querySelector('.app').webkitRequestFullscreen() ||
            this.template.querySelector('.app').mozRequestFullScreen() ||
            this.template.querySelector('.app').msRequestFullscreen());
    }

    closeFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    async handleQuizEnd() {
        clearTimeout(this.timer);
        await new Promise((resolve) => {
            this.template.querySelector('c-multiple-choice-comp').dispatchEvent(
                new CustomEvent('iscklickednextquestion', {
                    bubbles: true,
                    composed: true,
                })
            );
            setTimeout(() => resolve(), 1000); // Wait for 1 second
        });
        this.closeFullscreen();
    }

    async handleNextQuestion() {
        // clearTimeout(this.timer);
        await new Promise((resolve) => {
            switch (this.question.QuestionType__c) {
                case this.QUESTION_TYPES.MULTIPLE_CHOICE:
                    this.template.querySelector('c-multiple-choice-comp').dispatchEvent(
                        new CustomEvent('iscklickednextquestion', {
                            bubbles: true,
                            composed: true,
                        })
                    );
                    break;
                case this.QUESTION_TYPES.SINGLE_CHOICE:
                    this.template.querySelector('c-single-choice-comp').dispatchEvent(
                        new CustomEvent('iscklickednextquestion', {
                            bubbles: true,
                            composed: true,
                        })
                    );
                    break;
            } setTimeout(() => resolve(), 250);
        });

        if (this.currentQuestion >= this.questions.length) {
            this.handleQuizEnd();
        } else {
            await this.setIsNotQlickedNextQuestion();
            await this.incrementCurrentQuestion();
            await this.setQuestion(this.questions[this.currentQuestion - 1].question);
            await this.setAnswerOptions(this.questions[this.currentQuestion - 1].answerOptions);
            await this.setQuestionType(this.question.QuestionType__c);
            await this.setCountDown(this.question.TimeLimit__c).then(() => {
                this.countDownTimer();
            });
        }
    }

    async handleAnswerOptionClick(event) {
        await this.handleNextQuestion();
    }

    startQuiz() {
        this.isQuizStarted = true;
        this.countDownTimer();
        this.openFullscreen();
    }

    async getQuizzes() {
        try {
            const result = await getQuizzesWithQuestionsAndOptions({ quizId: this.quizId });
            if (result && result.quiz && result.questions) {
                await this.setQuiz(result.quiz);
                await this.setQuestions(result.questions);
                await this.setQuestion(this.questions[0].question);
                await this.setAnswerOptions(this.questions[0].answerOptions)
                await this.setQuestionType(this.question.QuestionType__c)
                await this.setCountDown(this.question.TimeLimit__c);
                console.log(this.questions);
            } else {
                console.error('No quiz data found for the given quizId.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des quizzes :', error);
        }
    }

    async handleChoiceAnswer(event) {
        const selectedAnswerOption = event.detail;

        await this.handleUserResponce(selectedAnswerOption);


        await this.handleNextQuestion();

    }

    async handleUserResponce(selectedAnswerOption = []) {
        await this.setIsQlickedNextQuestion();

        this.questions[this.currentQuestion - 1].statutClass =
            JSON.stringify(selectedAnswerOption.map((c) => { return c.OptionId })) === JSON.stringify(this.questions[this.currentQuestion - 1].correctAnswers.map((c) =>
                c.AnswerOption__c
            )) ?
                'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-green-500' :
                'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-red-500';

        // call api for set user responce in database
    }

    async checkQuestion(e) {
        await this.setIsNotQlickedNextQuestion();
        await this.handleUserResponce(e.detail);
    }

    clearTimer() {
        clearTimeout(this.timer);
    }

    connectedCallback() {
        this.imageBgLink = `background-image: linear-gradient(
            to left top,
            rgb(255, 255, 255, 0.7),
            rgb(252, 252, 252, 0.7)
        ),url('${quizePatternImage}')`;
        this.screenWithDesktop = window.screen.width >= 1096;
        this.addEventListener('checknextquestion', async (event) => {
            await this.handleUserResponce(event.detail);
            await this.setIsNotQlickedNextQuestion();
        });
    }
}