public without sharing class QuizController {
    
    @AuraEnabled(cacheable=true)
    public static QuizWrapper getQuizzesWithQuestionsAndOptions(Id quizId) {
        Quiz__c quiz = [SELECT Id, Name, Description__c, Duration__c
                        FROM Quiz__c WHERE Id = :quizId LIMIT 1];

        List<Question__c> questions = [SELECT Id, QuestionText__c, QuestionType__c, TimeLimit__c, 
                                       (SELECT Id, AnswerOptionText__c FROM AnswerOptions__r)
                                       FROM Question__c WHERE Quiz__c = :quiz.Id ORDER BY RandomizeOrder__c];

        List<QuestionWrapper> questionWrappers = new List<QuestionWrapper>();
        for (Question__c question : questions) {
            List<AnswerOption__c> answerOptions = question.AnswerOptions__r;
            List<Answer__c> correctAnswers = [SELECT Id, AnswerOption__c, AnswerText__c FROM Answer__c WHERE Question__c = :question.Id];
            questionWrappers.add(new QuestionWrapper(question, answerOptions, correctAnswers));
        }

        return new QuizWrapper(quiz, questionWrappers);
    }

    public class QuizWrapper {
        @AuraEnabled public Quiz__c quiz;
        @AuraEnabled public List<QuestionWrapper> questions;

        public QuizWrapper(Quiz__c quiz, List<QuestionWrapper> questions) {
            this.quiz = quiz;
            this.questions = questions;
        }
    }

    public class QuestionWrapper {
        @AuraEnabled public Question__c question;
        @AuraEnabled public List<AnswerOption__c> answerOptions;
        @AuraEnabled public List<Answer__c> correctAnswers;

        public QuestionWrapper(Question__c question, List<AnswerOption__c> answerOptions, List<Answer__c> correctAnswers) {
            this.question = question;
            this.answerOptions = answerOptions;
            this.correctAnswers = correctAnswers;
        }
    }
}