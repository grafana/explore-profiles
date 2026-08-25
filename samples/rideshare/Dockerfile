FROM golang:1.26.5@sha256:3aff6657219a4d9c14e27fb1d8976c49c29fddb70ba835014f477e1c70636647

WORKDIR /go/src/app
COPY . .

RUN echo $(pwd)

CMD ["go", "run", "."]
