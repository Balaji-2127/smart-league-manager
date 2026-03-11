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
            bat 'docker build -t smart-league-backend .'
        }
    }

    stage('Tag Docker Image') {
        steps {
            bat 'docker tag smart-league-backend balajid2206/smart-league-backend:latest'
        }
    }

    stage('Docker Login') {
        steps {
            withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                bat 'docker login -u %DOCKER_USER% -p %DOCKER_PASS%'
            }
        }
    }

    stage('Push Docker Image') {
        steps {
            bat 'docker push balajid2206/smart-league-backend:latest'
        }
    }

}


}
