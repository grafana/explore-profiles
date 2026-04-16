FROM golang:1.26@sha256:5f3787b7f902c07c7ec4f3aa91a301a3eda8133aa32661a3b3a3a86ab3a68a36

WORKDIR /go/src/app
COPY . .

RUN echo $(pwd)

CMD ["go", "run", "."]
