public without sharing class QuizController {
    @AuraEnabled(cacheable=true)
    public static QuizWrapper getQuizzesWithQuestionsAndOptions(Id quizId) {
        Quiz__c quiz = [SELECT Id, Name, Description__c, Duration__c 
                        FROM Quiz__c WHERE Id = :quizId LIMIT 1];

        List<QuestionQuiz__c> questionQuizzes = [SELECT Id, Question__c, Question__r.QuestionText__c,Question__r.Id, Question__r.QuestionType__c, Question__r.TimeLimit__c 
                                                 FROM QuestionQuiz__c 
                                                 WHERE Quiz__c = :quizId 
                                                 ORDER BY Question__r.RandomizeOrder__c];

        List<QuestionWrapper> questionWrappers = new List<QuestionWrapper>();
        
        for (QuestionQuiz__c questionQuiz : questionQuizzes) {
            List<AnswerOption__c> answerOptions = [SELECT AnswerOptionText__c 
                                                   FROM AnswerOption__c 
                                                   WHERE Question__c = :questionQuiz.Question__c];
            
            List<Answer__c> correctAnswers = [SELECT AnswerOption__c, AnswerText__c
                                              FROM Answer__c
                                              WHERE Question__c = :questionQuiz.Question__c];

            questionWrappers.add(new QuestionWrapper(questionQuiz.Question__r, answerOptions, correctAnswers));
        }

        return new QuizWrapper(quiz, questionWrappers);
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<Answer__c> getAnsswer(Id idQuestion){
        return  [SELECT AnswerOption__c, AnswerText__c
					FROM Answer__c
					WHERE Question__c = :idQuestion];
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