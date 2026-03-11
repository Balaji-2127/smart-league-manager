pipeline {
agent any


stages {

    stage('Install Client Dependencies') {
        steps {
            dir('client') {
                bat 'npm install'
            }
        }
    }

    stage('Install Server Dependencies') {
        steps {
            dir('server') {
                bat 'npm install'
            }
        }
    }

    stage('Build Docker Image') {
        steps {
            bat 'docker build -t smart-league-manager .'
        }
    }

}


}
