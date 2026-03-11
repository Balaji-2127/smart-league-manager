pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                git 'https://github.com/Balaji-2127/smart-league-manager.git'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t smart-league-backend ./server'
            }
        }

    }
}
