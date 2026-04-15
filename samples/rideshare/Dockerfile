FROM golang:1.25

WORKDIR /go/src/app
COPY . .

RUN echo $(pwd)

CMD ["go", "run", "."]
