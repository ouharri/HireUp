import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import validateToken from '@salesforce/apex/TokenManager.validateToken';
import getIdsFromToken from '@salesforce/apex/TokenManager.getIdsFromToken';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import getQuizzesWithQuestionsAndOptions from '@salesforce/apex/QuizController.getQuizzesWithQuestionsAndOptions';
import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 15;
const ALERT_THRESHOLD = 10;

const COLOR_CODES = {
    info: { color: "green" },
    warning: { color: "orange", threshold: WARNING_THRESHOLD },
    alert: { color: "red", threshold: ALERT_THRESHOLD }
};

export default class QuizeLwc extends LightningElement {
    // State variables
    @track isQuizStarted = false;
    @track currentQuestion = 1;
    @track countDown = 30;
    @track question = '';
    @track imageBgLink = '';
    @track isNotReadyStartQuiz = true;

    TIME_LIMIT = 30;
    @track timePassed = 0;
    @track remainingPathColor = 'base-timer__path-remaining ' + COLOR_CODES.info.color;
    @track timeLeft = 30;
    @track dashArray = '283';

    get formattedTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        let seconds = this.timeLeft % 60;

        if (seconds < 10) {
            seconds = `0${seconds}`;
        }

        return `${minutes}:${seconds}`;
    }

    getDashArray() {
        const rawTimeFraction = this.timeLeft / this.TIME_LIMIT;
        const fraction = rawTimeFraction - (1 / this.TIME_LIMIT) * (1 - rawTimeFraction);
        const circleDasharray = `${(fraction * FULL_DASH_ARRAY).toFixed(0)} 283`;
        return circleDasharray;
    }

    setRemainingPathColor(timeLeft) {
        const { alert, warning, info } = COLOR_CODES;
        if (timeLeft <= 10) {
            this.remainingPathColor = 'base-timer__path-remaining ' + alert.color;
        } else if (timeLeft <= 15) {
            this.remainingPathColor = 'base-timer__path-remaining ' + warning.color;
        }
    }

    get showAnimationIntro() {
        return !this.isQuizStarted && window.screen.width >= 1096;
    }

    @track questions = [];
    answerOptions = [];
    isClickedNextQuestion = false;
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
            this.TIME_LIMIT = value;
            this.timeLeft = value;
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

    getQuestionType() {
        switch (true) {
            case this.MULTIPLE_CHOICE:
                return this.QUESTION_TYPES.MULTIPLE_CHOICE;
            case this.SINGLE_CHOICE:
                return this.QUESTION_TYPES.SINGLE_CHOICE;
            case this.TRUE_FALSE:
                return this.QUESTION_TYPES.TRUE_FALSE;
            case this.SHORT_ANSWER:
                return this.QUESTION_TYPES.SHORT_ANSWER;
            case this.CURSOR:
                return this.QUESTION_TYPES.CURSOR;
            case this.PUZZLE:
                return this.QUESTION_TYPES.PUZZLE;
            case this.SURVEY:
                return this.QUESTION_TYPES.SURVEY;
            default:
                return this.QUESTION_TYPES.MULTIPLE_CHOICE;
        }
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

    setIsNotClickedNextQuestion = () => {
        return new Promise((resolve) => {
            this.isClickedNextQuestion = false;
            resolve();
        });
    };

    setIsClickedNextQuestion = () => {
        return new Promise((resolve) => {
            this.isClickedNextQuestion = true;
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

    async countDownTimer() {
        if (this.countDown > 0) {
            this.timer = setTimeout(() => {
                this.countDown--;
                this.timePassed = this.timePassed += 1;
                this.timeLeft = this.TIME_LIMIT - this.timePassed;
                this.setRemainingPathColor(this.timeLeft);
                this.dashArray = this.getDashArray();
                this.countDownTimer();
            }, 1000);
        } else if (this.countDown === 0) {
            await new Promise((resolve) => {
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
                setTimeout(resolve, 1000);
            }).then(() => {
                if (this.currentQuestion === this.questions.length) {
                    this.handleQuizEnd();
                } else {
                    this.handleNextQuestion();
                }
            });
        } else {
            clearTimeout(this.timer);
        }
    }

    setDefaultTimer() {
        this.dashArray = '283';
        this.timePassed = 0;
        this.remainingPathColor = 'base-timer__path-remaining ' + COLOR_CODES.info.color;
    }

    async handleNextQuestion() {
        await new Promise((resolve) => {
            switch (this.question.QuestionType__c) {
                case this.QUESTION_TYPES.MULTIPLE_CHOICE:
                    this.template.querySelector('c-multiple-choice-comp').dispatchEvent(
                        new CustomEvent('isClickedNextQuestion', {
                            bubbles: true,
                            composed: true,
                        })
                    );
                    break;
                case this.QUESTION_TYPES.SINGLE_CHOICE:
                    this.template.querySelector('c-single-choice-comp').dispatchEvent(
                        new CustomEvent('isClickedNextQuestion', {
                            bubbles: true,
                            composed: true,
                        })
                    );
                    break;
            }
            setTimeout(() => resolve(), 250); // Resolving after the timeout
        }).then(async () => {
            if (this.currentQuestion >= this.questions.length) {
                this.handleQuizEnd();
            } else {
                this.dashArray = '283';
                await this.setIsNotClickedNextQuestion();
                await this.incrementCurrentQuestion();
                await this.setQuestion(this.questions[this.currentQuestion - 1].question);
                await this.setQuestionType(this.question.QuestionType__c);
                await this.setAnswerOptions(
                    this.getQuestionType() === this.QUESTION_TYPES.TRUE_FALSE ?
                        [{ Id: '0', AnswerOptionText__c: 'False' },
                        { Id: '1', AnswerOptionText__c: 'True' }]
                        : this.questions[this.currentQuestion - 1].answerOptions
                );
                await this.setCountDown(this.question.TimeLimit__c);
                this.countDownTimer();
            }
        });
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
                new CustomEvent('isClickedNextQuestion', {
                    bubbles: true,
                    composed: true,
                })
            );
            setTimeout(() => resolve(), 250); // Wait for 1 second
        });
        this.closeFullscreen();
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
                this.isNotReadyStartQuiz = false;
            } else {
                console.error('No quiz data found for the given quizId.');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des quizzes :', error);
        }
    }

    async handleChoiceAnswer(event) {
        const selectedAnswerOption = event.detail;
        await this.handleUserResponse(selectedAnswerOption);
        await this.handleNextQuestion();
    }

    async handleUserResponse(selectedAnswerOption = []) {
        await this.setIsClickedNextQuestion();
        this.questions[this.currentQuestion - 1].statutClass =
            JSON.stringify(selectedAnswerOption.map((c) => { return c.OptionId })) === JSON.stringify(this.questions[this.currentQuestion - 1].correctAnswers.map((c) =>
                c.AnswerOption__c || c.AnswerText__c
            )) ?
                'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-green-500' :
                'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-red-500';
        // call API to set user response in the database
    }

    async checkQuestion(e) {
        await this.setIsNotClickedNextQuestion();
        await this.handleUserResponse(e.detail);
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
        this.addEventListener('checknextquestion', async (event) => {
            await this.handleUserResponse(event.detail);
            await this.setIsNotClickedNextQuestion();
        });
    }
}
