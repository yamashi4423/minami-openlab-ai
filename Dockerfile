# 使用するベースイメージを指定。Node.jsの最新安定バージョンが含まれていることを想定
FROM node:16-bullseye

# コンテナ内のワークディレクトリを設定。アプリケーションのファイルはこのディレクトリに配置される
# WORKDIR /home

# システムパッケージのアップデートと必要な依存関係のインストール
RUN apt-get update && apt-get install -y \
    build-essential \ 
    curl \ 
    git \ 
 && apt-get clean \ 
 && rm -rf /var/lib/apt/lists/* 

# GitHubからプロジェクトをクローンする
#RUN git clone https://github.com/pixiv/ChatVRM

# プロジェクトのディレクトリにワークディレクトリを変更
#WORKDIR /home/ChatVRM

# browserslistデータベースを最新のものに更新
# RUN npx -y update-browserslist-db@latest

# アプリケーションに必要なNode.jsモジュールをインストール
# RUN npm install

# コンテナが3000番ポートをリッスンすることを示す。この設定はドキュメントの役割を果たし、実際にはポートを公開しない
EXPOSE 3000