pipeline {
    agent any
    
    stages {
        stage('Clone repository') {
            steps {
                // Utiliza las credenciales de GitHub para autenticarte
                git credentialsId: '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', url: 'https://github.com/oscariglesias21/gpsGit.git'
            }
        }
        stage('Copy files to EC2') {
            steps {
                // Copia los archivos a la instancia EC2 utilizando la clave SSH
                sh 'scp -i /home/ubuntu/hammer.pem -r * ubuntu@44.198.179.134:~/gpsGit'
            }
        }
        stage('Push changes') {
            steps {
                // Cambia al directorio clonado
                dir('gpsGit') {
                    // Añade todos los archivos modificados al área de trabajo
                    sh 'git add .'
                    // Realiza un commit de los cambios
                    sh 'git commit -m "Actualizacion desde Jenkins"'
                    // Realiza el push de los cambios al repositorio remoto
                    sh 'git push origin master'
                }
            }
        }
    }
}
