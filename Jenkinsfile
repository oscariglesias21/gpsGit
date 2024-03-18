//pipeline {
//    agent any
//        stages {
//                stage('Clone repository') {
//                    steps {
//                         withCredentials([string(credentialsId: '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')]) {
//
//                            // Utiliza las credenciales de GitHub para autenticarte
//                           git credentialsId: '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', url: 'https://github.com/oscariglesias21/gpsGit.git'
//                         }
//                    }
//                }
//                stage('Copy files to EC2') {
//                    steps {
//                         withCredentials([string(credentialsId: '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')]) {
//                            // Copia los archivos a la instancia EC2 utilizando la clave SSH
//                           sh 'scp -i /home/ubuntu/hammer.pem -r * ubuntu@44.198.179.134:~/gpsGit'
//                         }
//                    }
//                }                
//        }
//    
//}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                // Clonar el repositorio de GitHub
                git 'https://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@github.com/oscariglesias21/gpsGit.git'
            }
        }
        stage('Build') {
            steps {
                // Ejecutar comandos de construcción
                sh 'npm install' // Instala las dependencias de Node.js
                sh 'npm run wbsv.js' // Compila el código de tu aplicación
            }
        }
        stage('Deploy to EC2') {
            steps {
                script {
                    // Copiar el repositorio a la instancia EC2 usando scp
                    sh '''
                        scp -i /home/ubuntu/hammer.pem -o StrictHostKeyChecking=no -r /var/lib/jenkins/jobs/thor ubuntu@44.198.179.134:/home/ubuntu/gpsGit
                    '''
                    // Conectarse a la instancia EC2 y ejecutar comandos de despliegue
                    sshagent(['ubuntu']) {
                        sh '''
                            ssh -i /home/ubuntu/hammer.pem -o StrictHostKeyChecking=no ubuntu@44.198.179.134 '
                            cd /home/ubuntu/gpsGit
                            git pull
                            node wbsv.js
                            '
                        '''
                    }
                }
            }
        }
    }
}

