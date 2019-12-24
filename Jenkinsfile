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
            docker tag docker.cloud.cluster.fun/averagemarcus/blog:${env.GIT_COMMIT} docker.cloud.cluster.fun/averagemarcus/blog:latest
            docker push docker.cloud.cluster.fun/averagemarcus/blog:${env.GIT_COMMIT}
            docker push docker.cloud.cluster.fun/averagemarcus/blog:latest
            """
        }
      }
    }

    stage('Restart deployment') {
      when { branch 'master' }
      steps {
        container('kubectl') {
          sh """
            set +x
            mkdir -p ~/.kube/
            printf "\$CLOUD_KUBECONFIG" > ~/.kube/config
            kubectl --kubeconfig ~/.kube/config rollout restart deployment/blog --namespace default
            """
        }
      }
    }

    stage('Mirror to GitHub') {
      when { branch 'master' }
      environment {
        GITHUB_TOKEN = credentials('Github_token')
      }
      steps {
        sh """
          git remote add github https://${GITHUB_TOKEN}:@github.com/AverageMarcus/blog.git
          git push github master
          """
      }
    }

  }
}
