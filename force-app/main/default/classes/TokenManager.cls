global without sharing class TokenManager {
    private static final String ENCRYPTION_KEY = '00D8e000000TGLFEA420230724144223';

    public static String generateToken(Id leadId, Id quizId) {
        if (quizId == null || leadId == null) {
            return null;
        }

        String tokenData = leadId + '-' + quizId;

        Blob sKeyBlob = Blob.valueOf(ENCRYPTION_KEY);

        Blob cipherText = Crypto.encryptWithManagedIV('AES256', sKeyBlob, Blob.valueOf(tokenData));

        String encodedCipherText = EncodingUtil.convertToHex(cipherText);
        String encodedId = EncodingUtil.urlEncode(encodedCipherText, 'UTF-8');

        return encodedId;
    }

    global static Map<String, Id> getIdsFromToken(String encryptedToken) {
        Map<String, Id> idsMap = new Map<String, Id>();

        try {
            String encodedCipherText = EncodingUtil.urlDecode(encryptedToken, 'UTF-8');
            Blob encodedEncryptedBlob = EncodingUtil.convertFromHex(encodedCipherText);

            Blob sKeyBlob = Blob.valueOf(ENCRYPTION_KEY);

            Blob decryptedBlob = Crypto.decryptWithManagedIV('AES256', sKeyBlob, encodedEncryptedBlob);
            String decryptedToken = decryptedBlob.toString();

            List<String> tokenDataList = decryptedToken.split('-');
            if (tokenDataList.size() == 2) {
                idsMap.put('LeadId', Id.valueOf(tokenDataList[0]));
                idsMap.put('QuizId', Id.valueOf(tokenDataList[1]));
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Error in getIdsFromToken: ' + e.getMessage());
        }

        return idsMap;
    }

    @AuraEnabled(cacheable=true)
    global static Boolean validateToken(String encryptedToken) {
        Map<String, Id> idsMap = getIdsFromToken(encryptedToken);

        if (!idsMap.isEmpty() && idsMap.containsKey('LeadId') && idsMap.containsKey('QuizId')) {
            Id leadId = idsMap.get('LeadId');
            Id quizId = idsMap.get('QuizId');

            if (String.isBlank(leadId) || String.isBlank(quizId)) {
                return false;
            }

            try {
                List<Lead> leadList = [SELECT Id FROM Lead WHERE Id = :leadId LIMIT 1];
                List<Quize__c> quizList = [SELECT Id FROM Quize__c WHERE Id = :quizId LIMIT 1];

                if (leadList.size() == 1 && quizList.size() == 1) {
                    return true;
                }
            } catch (Exception e) {
                System.debug(LoggingLevel.ERROR, 'Error in validateToken: ' + e.getMessage());
            }
        }

        return false;
    }
}