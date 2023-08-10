import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import validateToken from '@salesforce/apex/TokenManager.validateToken';
import getIdsFromToken from '@salesforce/apex/TokenManager.getIdsFromToken';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import getQuizzesWithQuestionsAndOptions from '@salesforce/apex/QuizController.getQuizzesWithQuestionsAndOptions';
import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';
import sweet from '@salesforce/resourceUrl/sweet';

export default class QuizeLwc extends LightningElement {
    parentRef = this;

    // State variables
    FULL_DASH_ARRAY = 283;
    WARNING_THRESHOLD = 1 / 2;
    ALERT_THRESHOLD = 1 / 4;

    COLOR_CODES = {
        info: { color: "green" },
        warning: { color: "orange", threshold: this.WARNING_THRESHOLD },
        alert: { color: "red", threshold: this.ALERT_THRESHOLD }
    };

    @track isQuizStarted = false;
    @track currentQuestion = 1;
    @track countDown = 30;
    @track question = '';
    @track imageBgLink = '';
    @track isNotReadyStartQuiz = true;

    @track appClass = 'app'

    TIME_LIMIT = 30;
    @track timePassed = 0;
    @track remainingPathColor = 'base-timer__path-remaining ' + this.COLOR_CODES.info.color;
    @track timeLeft = 30;
    @track displayTime = '00:00';
    @track dashArray = '283';

    formattedTime(countDown) {
        const minutes = Math.floor(countDown / 60);
        let seconds = countDown % 60;
        if (seconds < 10) {
            seconds = `0${seconds}`;
        }
        return `${minutes}:${seconds}`;
    }

    getDashArray() {
        const rawTimeFraction = this.timeLeft / this.TIME_LIMIT;
        const fraction = rawTimeFraction - (1 / this.TIME_LIMIT) * (1 - rawTimeFraction);
        const circleDasharray = `${(fraction * this.FULL_DASH_ARRAY).toFixed(0)} 283`;
        return circleDasharray;
    }

    setRemainingPathColor(timeLeft, baseTime) {
        const { alert, warning, info } = this.COLOR_CODES;
        if (timeLeft <= Math.floor(baseTime * this.ALERT_THRESHOLD)) {
            this.remainingPathColor = 'base-timer__path-remaining ' + alert.color;
        } else if (timeLeft <= Math.floor(baseTime * this.WARNING_THRESHOLD)) {
            this.remainingPathColor = 'base-timer__path-remaining ' + warning.color;
        }
    }

    get showAnimationIntro() {
        return !this.isQuizStarted && window.screen.width >= 1096;
    }

    @track questions = [];
    @track questionAttributes;
    answerOptions = [];
    isClickedNextQuestion = false;
    quiz = { 'Name': 'QUIZ', 'Description__c': '', 'Duration__c': '' };

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.token = currentPageReference.state?.id;
            this.validateToken(currentPageReference.state?.id);
        }
    }

    @track timerFullScreenClass = 'timerClass';
    @track isEditorFullScreen = false;


    token = null;
    timer = null;
    quizId = null;
    LeadId = null;

    @track MULTIPLE_CHOICE = false;
    @track SINGLE_CHOICE = false;
    @track TRUE_FALSE = false;
    @track SHORT_ANSWER = false;
    @track PROBLEM_SOLVING = false;
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
        SURVEY: 'Sondage',
        PROBLEM_SOLVING: 'problem solving'
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
            this.displayTime = this.formattedTime(value);
            resolve();
        });
    };

    setQuestions = (value) => {
        return new Promise((resolve) => {
            this.questions = value.map(question => {
                const modifiedQuestion = {
                    ...question,
                    statutClass: 'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-gray-200'
                };
                return modifiedQuestion;
            });
            resolve();
        });
    };

    setQuestionAttributes = (value) => {
        return new Promise((resolve) => {
            this.questionAttributes = value;
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
                case this.QUESTION_TYPES.PROBLEM_SOLVING:
                    this.PROBLEM_SOLVING = true;
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
            case this.PROBLEM_SOLVING:
                return this.QUESTION_TYPES.PROBLEM_SOLVING;
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
            this.PROBLEM_SOLVING = false;
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
                this.displayTime = this.formattedTime(this.countDown);
                this.setRemainingPathColor(this.timeLeft, this.TIME_LIMIT);
                this.dashArray = this.getDashArray();
                this.countDownTimer();
            }, 1000);
        } else if (this.countDown === 0) {
            this.setDefaultTimer();
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
                    case this.QUESTION_TYPES.SHORT_ANSWER:
                        break;
                    case this.QUESTION_TYPES.PROBLEM_SOLVING:
                        break;
                    default:
                        return;
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

    async setDefaultTimer() {
        return new Promise((resolve) => {
            this.dashArray = '283';
            this.timePassed = 0;
            this.remainingPathColor = 'base-timer__path-remaining ' + this.COLOR_CODES.info.color;
            resolve();
        });
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
                await this.setDefaultTimer();
                await this.setIsNotClickedNextQuestion();
                await this.incrementCurrentQuestion();
                await this.setQuestionAttributes(this.questions[this.currentQuestion - 1]);
                await this.setQuestion(this.questionAttributes.question);
                console.log('aji lhna : ', this.questionAttributes);
                await this.setQuestionType(this.question.QuestionType__c);
                await this.setAnswerOptions(
                    this.getQuestionType() === this.QUESTION_TYPES.TRUE_FALSE ?
                        [{ Id: '0', AnswerOptionText__c: 'False' },
                        { Id: '1', AnswerOptionText__c: 'True' }]
                        : this.questions[this.currentQuestion - 1].answerOptions
                );
                await this.setCountDown(this.question.TimeLimit__c);
                this.countDownTimer();
                console.log('questionAttributes : ', this.questionAttributes);
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
            console.log(result);
            if (result && result.quiz && result.questions) {
                await this.setQuiz(result.quiz);
                await this.setQuestionAttributes(result.questions[0]);
                await this.setQuestions(result.questions);
                await this.setQuestion(this.questionAttributes.question);
                await this.setAnswerOptions(this.questionAttributes.answerOptions)
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

    async handleUserResponse(selectedAnswerOption) {
        await this.setIsClickedNextQuestion();
        this.questions[this.currentQuestion - 1].statutClass =
            selectedAnswerOption ?
                'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-green-500' :
                'w-2 h-2 rounded text-white mx-1 text-center text-xs flex items-center justify-center bg-red-500';

        // call API to set user response in the database
    }

    async checkQuestion(e) {
        await this.setIsNotClickedNextQuestion();
        await this.handleUserResponse(e.detail);
    }

    handleFullScreenTimer(e) {
        if (e.detail) {
            this.isEditorFullScreen = true;
            this.appClass = 'appFullScreen';
            this.timerFullScreenClass = (window.screen.width <= 526) ? 'timerFullScreenMobileClass' : 'timerFullScreenClass';
        } else {
            this.isEditorFullScreen = false;
            this.appClass = 'app';
            this.timerFullScreenClass = 'timerClass';
        }
    }

    clearTimer() {
        clearTimeout(this.timer);
    }

    connectedCallback() {
        Promise.all([
            loadStyle(this, flowbitecss),
            loadScript(this, flowbitejs),
            loadScript(this, sweet),
        ])
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