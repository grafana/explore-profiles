FROM python:3.9@sha256:da5aee29682d12a6649f51c8d6f15b87deb3e6c524b923c41d0cb3304d07c913

RUN pip3 install requests

COPY load-generator.py ./load-generator.py

ENV PYTHONUNBUFFERED=1

CMD [ "python", "load-generator.py" ]
