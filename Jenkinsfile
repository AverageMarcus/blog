pipeline {
  agent { label "dind" }

  stages {

    stage('Create Docker image') {
      steps {
        container('docker') {
          sh """
            docker build -t docker.cloud.cluster.fun/averagemarcus/blog:${env.GIT_COMMIT} .
            """
        }
      }
    }

    stage('Publish Docker image') {
      when { branch 'master' }
      environment {
        DOCKER_CREDS = credentials('Harbor')
      }
      steps {
        container('docker') {
          sh """
            docker login docker.cloud.cluster.fun -u $DOCKER_CREDS_USR -p $DOCKER_CREDS_PSW
            docker push docker.cloud.cluster.fun/averagemarcus/blog:${env.GIT_COMMIT}
            """
        }
      }
    }

  }
}
