pipeline {
    agent any
    
    stages {
        stage('Clone repository') {
            steps {
                git 'https://github.com/oscariglesias21/gpsGit.git'
            }
        }
        stage('Copy files to EC2') {
            steps {
                sh 'scp -i /home/ubuntu/hammer.pem -r * ubuntu@44.198.179.134:/gpsGit'
            }
        }
    }
}