import os
import random
import requests
import time

VEHICLES = [
    'bike',
    'scooter',
    'car',
]

DEBUG = os.environ["DEBUG"] == "1"

def log(msg, fatal = False):
    if fatal or DEBUG:
        print(msg)

if __name__ == "__main__":
    log(f"starting load generator")

    host_prefix = os.environ['HOST_PREFIX']
    replicas = int(os.environ['REPLICAS'])

    time.sleep(10)
    while True:
        replica = random.randint(1, replicas)
        host = f'{host_prefix}-{replica}'
        vehicle = VEHICLES[random.randint(0, len(VEHICLES) - 1)]

        log(f"requesting {vehicle} from {host}")
        try:
            resp = requests.get(f'http://{host}:5000/{vehicle}')
            resp.raise_for_status()
            log(f"received {resp}")
        except BaseException as e:
            log(f"http error {e}", fatal=True)

        time.sleep(random.uniform(0.2, 0.4))
