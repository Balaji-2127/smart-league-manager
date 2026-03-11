pipeline {
agent any


stages {

    stage('Install Backend Dependencies') {
        steps {
            bat 'npm install'
        }
    }

    stage('Build Docker Image') {
        steps {
            bat 'docker build -t smart-league-manager .'
        }
    }

}


}
