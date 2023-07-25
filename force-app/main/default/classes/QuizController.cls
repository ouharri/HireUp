public with sharing class QuizController {
    @AuraEnabled
    public static List<QuizWrapper> getQuizzesWithQuestionsAndOptions(Id quizId) {
        List<Quiz__c> quizzes = [SELECT Id, Name, Description__c, Duration__c 
                                 FROM Quiz__c WHERE Id = :quizId];

        List<QuizWrapper> quizWrappers = new List<QuizWrapper>();
        for (Quiz__c quiz : quizzes) {
            List<Question__c> questions = [SELECT Id, QuestionText__c, QuestionType__c, TimeLimit__c 
                                           FROM Question__c WHERE Quiz__c = :quiz.Id ORDER BY RandomizeOrder__c];

            List<QuestionWrapper> questionWrappers = new List<QuestionWrapper>();
            for (Question__c question : questions) {
                List<AnswerOption__c> answerOptions = [SELECT Id, AnswerOptionText__c 
                                                       FROM AnswerOption__c WHERE Question__c = :question.Id];
                questionWrappers.add(new QuestionWrapper(question, answerOptions));
            }

            quizWrappers.add(new QuizWrapper(quiz, questionWrappers));
        }

        return quizWrappers;
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

        public QuestionWrapper(Question__c question, List<AnswerOption__c> answerOptions) {
            this.question = question;
            this.answerOptions = answerOptions;
        }
    }
}
