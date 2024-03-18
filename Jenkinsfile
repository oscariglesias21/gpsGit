pipeline {
    agent any
        stages {
                stage('Clone repository') {
                    steps {
                         withCredentials([string(credentialsId: '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')]) {

                            // Utiliza las credenciales de GitHub para autenticarte
                            git credentialsId: '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', url: 'https://github.com/oscariglesias21/gpsGit.git'
                         }
                    }
                }
                stage('Copy files to EC2') {
                    steps {
                         withCredentials([string(credentialsId: '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')]) {
                            // Copia los archivos a la instancia EC2 utilizando la clave SSH
                            sh 'scp -i /home/ubuntu/hammer.pem -r * ubuntu@44.198.179.134:~/gpsGit'
                         }
                    }
                }
                
            
        }
    
}
